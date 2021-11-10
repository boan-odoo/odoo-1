# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from collections import defaultdict

import random

from odoo import api, fields, models, _
from odoo.fields import Command
from odoo.exceptions import ValidationError
from odoo.tools.float_utils import float_round
from odoo.tools.misc import formatLang
from odoo.osv import expression

def _generate_random_reward_code():
    # 8 bits seems enough as it is already unlikely that multiple same rewards are claimed on an order
    return str(random.getrandbits(8))

class SaleOrder(models.Model):
    _inherit = "sale.order"

    generated_coupon_ids = fields.One2many('loyalty.card', 'order_id', string="Offered Coupons", copy=False)
    # Contains how much points should be given to a coupon upon validating the order
    coupon_point_ids = fields.One2many('sale.order.coupon.points', 'order_id', copy=False)
    reward_amount = fields.Float(compute='_compute_reward_total')
    # TODO: Check if droppable
    no_code_promo_program_ids = fields.Many2many('loyalty.program', string="Applied Immediate Promo Programs",
        domain="[('trigger', '=', 'auto'), '|', ('company_id', '=', False), ('company_id', '=', company_id)]", copy=False)
    # TODO: Check if droppable
    code_promo_program_id = fields.Many2one('loyalty.program', string="Applied Promo Program",
        domain="[('trigger', '=', 'with_code'), '|', ('company_id', '=', False), ('company_id', '=', company_id)]", copy=False)
    promo_code = fields.Char(related='code_promo_program_id.code', help="Applied program code", readonly=False) #TODO: check why this is not readonly

    @api.depends('order_line')
    def _compute_reward_total(self):
        for order in self:
            # TODO: this will be invalid since free product lines will now contain the product without
            #  the price, displayed in website_sale
            order.reward_amount = sum([line.price_subtotal for line in order._get_reward_lines()])

    def _get_no_effect_on_threshold_lines(self):
        self.ensure_one()
        lines = self.env['sale.order.line']
        return lines

    @api.returns('self', lambda value: value.id)
    def copy(self, default=None):
        order = super(SaleOrder, self).copy(default)
        reward_line = order._get_reward_lines()
        if reward_line:
            reward_line.unlink()
            order._create_new_no_code_promo_reward_lines()
        return order

    def action_confirm(self):
        for order in self:
            status = order._check_update_applied_rewards(block=True)
            if 'error' in status:
                raise ValidationError(status['error'])
        #TODO: do we drop coupon state?
        # self.generated_coupon_ids.write({'state': 'new'})
        # self.applied_coupon_ids.write({'state': 'used'})
        # Add/remove the points to our coupons
        for coupon, changes in self._get_point_changes().items():
            coupon.points += changes
        self._send_reward_coupon_mail()
        return super(SaleOrder, self).action_confirm()

    def action_cancel(self):
        res = super(SaleOrder, self).action_cancel()
        #TODO: do we drop coupon state?
        # self.generated_coupon_ids.write({'state': 'expired'})
        # self.applied_coupon_ids.write({'state': 'new'})
        # Add/remove the points to our coupons
        for coupon, changes in self._get_point_changes().items():
            coupon.points -= changes
        # self.applied_coupon_ids.sales_order_id = False
        self._check_update_applied_rewards()
        return res

    def action_draft(self):
        res = super(SaleOrder, self).action_draft()
        #TODO: do we drop coupon state?
        # self.generated_coupon_ids.write({'state': 'reserved'})
        return res

    def _get_reward_lines(self):
        self.ensure_one()
        return self.order_line.filtered(lambda line: line.reward_id)

    def _is_global_discount_already_applied(self):
        return any(reward.is_global_discount for reward in self.order_line.reward_id)

    def _get_reward_values_product(self, reward, coupon, product=None, **kwargs):
        self.ensure_one()
        if not reward.reward_type == 'product':
            raise ValidationError(_('The specified reward is not of type free product'))
        additional_points = kwargs.get('additional_points', 0)
        program = reward.program_id
        product = product or reward._get_reward_products()[:1]
        if not product:
            raise ValidationError(_('No applicable product was found for your reward.'))
        taxes = self.fiscal_position_id.map_tax(reward.reward_product_id.taxes_id.filtered(lambda t: t.company_id == self.company_id))
        return [{
            'product_id': product.id,
            'price_unit': 0,
            'product_uom_qty': reward.reward_product_qty,
            'reward_id': reward.id,
            'coupon_id': coupon.id,
            'points_cost': reward.required_points if not reward.clear_wallet else (self._get_real_points_for_coupon(coupon) + additional_points),
            'reward_identifier_code': _generate_random_reward_code(),
            'name': product.display_name + '\n' + program.name,
            'product_uom': product.uom_id.id,
            'tax_id': [(4, tax.id, False) for tax in taxes]
        }]

    def _get_paid_order_lines(self):
        """ Returns the sale order lines that are not reward lines. """
        return self.order_line.filtered(lambda x: not x.is_reward_line)

    def _get_base_order_lines(self, program):
        """ Returns the sale order lines not linked to the given program.
        """
        return self.order_line.filtered(lambda x: not x._is_not_sellable_line() or (x.is_reward_line and x.product_id != program.discount_line_product_id))

    def _get_cheapest_line(self):
        # Unit prices tax included
        return min(self.order_line.filtered(lambda x: not x._is_not_sellable_line() and x.price_reduce > 0), key=lambda x: x['price_reduce'])

    def _get_reward_values_discount(self, reward, coupon, **kwargs):
        self.ensure_one()
        if not reward.reward_type == 'discount':
            raise ValidationError(_('The specified reward is not of type discount'))
        # Used when checking if a reward is still applicable or recomputing a discount
        additional_points = kwargs.get('additional_points', 0)
        consumable_points = (self._get_real_points_for_coupon(coupon) if reward.clear_wallet\
                            else coupon.points) + additional_points
        # Figure out which lines are concerned by the discount
        if reward.discount_applicability == 'order':
            concerned_lines = self._get_paid_order_lines()
        elif reward.discount_applicability == 'cheapest':
            concerned_lines = self._get_cheapest_line()
        elif reward.discount_applicability == 'specific':
            concerned_lines = self._get_paid_order_lines().filtered(lambda l: l.product_id in reward.discount_product_ids)
        # NOTE: should this be converted using the currency?
        max_discount = reward.discount_max_amount or float('inf')
        if reward.discount_applicability != 'cheapest':
            concerned_lines_total = sum(concerned_lines.mapped('price_subtotal'))
        else:
            # Discount on cheapest product -> only applies to 1 qty
            concerned_lines_total = concerned_lines.price_reduce
        if reward.discount_mode == 'per_point':
            max_discount = min(max_discount, reward.discount * (self._get_real_points_for_coupon(coupon) + additional_points))
        elif reward.discount_mode == 'per_order':
            max_discount = min(max_discount, reward.discount)
        elif reward.discount_mode == 'percent':
            max_discount = min(max_discount, concerned_lines_total * (reward.discount / 100))
        max_discount = reward.currency_id._convert(max_discount, self.currency_id, self.company_id, fields.Date.today())
        if reward.discount_mode in ('per_point', 'per_order'):
            # This is considered a fixed amount discount
            discounted_amount = min(max_discount, concerned_lines_total)
            product_taxes = reward.discount_line_product_id.taxes_id.filtered(lambda tax: tax.company_id == self.company_id)
            taxes = self.fiscal_position_id.map_tax(product_taxes)
            consumed_points = reward.required_points if not reward.clear_wallet else (self._get_real_points_for_coupon(coupon) + additional_points)
            if not reward.clear_wallet and reward.discount_mode == 'per_point':
                consumed_points = float_round(discounted_amount / reward.discount, precision_rounding=1, rounding_method='UP')
            if not discounted_amount:
                raise ValidationError(_('There is nothing to discount.'))
            return [{
                'name': _('Discount: %s', reward.program_id.name),
                'product_id': reward.discount_line_product_id.id,
                'price_unit': -discounted_amount,
                'product_uom_qty': 1,
                'product_uom': reward.discount_line_product_id.uom_id.id,
                'reward_id': reward.id,
                'coupon_id': coupon.id,
                'points_cost': consumed_points,
                'reward_identifier_code': _generate_random_reward_code(),
                'tax_id': [(4, tax.id, False) for tax in taxes]
            }]
        # Discount per taxes
        reward_dict = dict()
        reward_code = _generate_random_reward_code()
        # We need to limit how much we discount per line since this is a discount in %
        # Since we already know how much we can discount and how much is to be paid, we can make a factor
        # Imagine a discount of 50% with a max of 30$ on a 100$ order
        #  You will have a factor of 0.6 so that 30$ = total * discount * factor
        discount_factor = min(1, max_discount / (concerned_lines_total * (reward.discount / 100)))
        discount_factor_display = float_round(discount_factor * 100, precision_digits=2)
        for line in concerned_lines:
            this_line_discount = (line.product_uom_qty * line.price_reduce * (reward.discount / 100)) * discount_factor
            if this_line_discount:
                if line.tax_id in reward_dict:
                    reward_dict[line.tax_id]['price_unit'] -= this_line_discount
                else:
                    taxes = self.fiscal_position_id.map_tax(line.tax_id)

                    reward_dict[line.tax_id] = {
                        'name': _(
                            'Discount: %(program)s - On product with the following taxes: %(taxes)s%(limited_suffix)s',
                            program=reward.program_id.name,
                            taxes=", ".join(taxes.mapped('name')),
                            limited_suffix='' if discount_factor == 1 else\
                                _(' limited to %s%% of the discount', discount_factor_display)
                        ),
                        'product_id': reward.discount_line_product_id.id,
                        'price_unit': -this_line_discount,
                        'product_uom_qty': 1.0,
                        'product_uom': reward.discount_line_product_id.uom_id.id,
                        'reward_id': reward.id,
                        'coupon_id': coupon.id,
                        'points_cost': 0,
                        'reward_identifier_code': reward_code,
                        'tax_id': [(4, tax.id, False) for tax in taxes],
                    }
        if not reward_dict:
            raise ValidationError(_('There is nothing to discount.'))
        # We only assign the point cost to one line to avoid counting the cost multiple times
        reward_dict[next(iter(reward_dict))]['points_cost'] = consumable_points
        return reward_dict.values()

    def _send_reward_coupon_mail(self):
        coupons = self.env['loyalty.card']
        for order in self:
            coupons |= order._get_reward_coupons()
        if coupons:
            coupons._send_creation_communication()

    def _get_applicable_programs(self):
        """
        This method is used to return the valid applicable programs on given order.
        """
        self.ensure_one()
        applicable_with_points = self._get_applicable_programs_points()
        return self.env.browse(k.id for k in applicable_with_points)

    def _get_applicable_programs_points(self, domain=None):
        """
        Returns a dict with the points per program for each program that is applicable
        """
        self.ensure_one()
        if not domain:
            domain = [('company_id', 'in', (self.company_id.id, False))]
        # No other way than to test all programs to the order
        programs = self.env['loyalty.program'].search(domain, order="id")
        program_points = dict()
        order_products = self.order_line.product_id
        for program in programs:
            # Try to prefilter as much as possible
            if len(program.rule_ids) == 1:
                if not order_products.filtered_domain(program.rule_ids._get_valid_product_domain()) or\
                    self.amount_total < program.rule_ids.minimum_amount:
                    continue
            status = self._program_check_compute_points(program)
            if 'points' in status:
                program_points[program] = status['points']
        return program_points


    def _check_update_applied_rewards(self, block=False):
        """
        Check all applied rewards and programs.

        Make sure to abort the transaction if using blocking.

        This method does multiple things.
        1) It checks that all applied programs still are applicable.
        2) Update the amount of points the order gives to the coupon.
        3) Make sure that all rewards still have enough points to be applicable.
        4) Update all rewards to make sure the right prices are used.

        Returns a dict containing a possible error or empty.
        """
        self.ensure_one()
        points_program = self._get_points_programs()
        point_entry_per_program = defaultdict(lambda: self.env['sale.order.coupon.points'])
        for pe in self.coupon_point_ids:
            point_entry_per_program[pe.coupon_id.program_id] |= pe
        for program in points_program:
            status = self._program_check_compute_points(program)
            if block and 'error' in status:
                return status
            if 'error' in status:
                # Delete coupon if program applies to future order
                if program.applies_on == 'future':
                    point_entry_per_program[program].coupon_id.unlink()
                point_entry_per_program[program].sudo().unlink()
                point_entry_per_program.remove(program)
                # Rewards if program applies to the current order
                if program.apples_on == 'current':
                    self.order_line.filtered(lambda l: l.reward_id in program.reward_ids).unlink()
            else:
                all_point_changes = [status['points']]
                for rule, rule_points in status.items():
                    if isinstance(rule, str):
                        continue
                    all_point_changes.extend(rule_points)
                program_pes = point_entry_per_program[program]
                for pe, points in zip(program_pes, all_point_changes):
                    pe.points = points
                if len(program_pes) < len(all_point_changes):
                    new_coupon_points = all_point_changes[len(program_pes):]
                    new_coupons = self.env['loyalty.card'].create([{
                        'program_id': program.id,
                        'partner_id': self.partner_id.id,
                        'shared_code': False,
                        'points': 0,
                        'order_id': self.id,
                    } for _ in new_coupon_points])
                    for x, coupon in zip(new_coupon_points, new_coupons):
                        self._add_points_for_coupon(coupon, x)
                elif len(program_pes) > len(all_point_changes):
                    pes_to_unlink = program_pes[len(all_point_changes):]
                    pes_to_unlink.coupon_id.sudo().unlink()
                    pes_to_unlink.sudo().unlink()
                point_entry_per_program[program].points = status['points']
        processed_rewards = set()
        lines_to_remove = self.env['sales.order.line']
        line_updates = []
        for line in self.order_line:
            if not line.reward_id or not line.coupon_id or (line.reward_id, line.reward_identifier_code) in processed_rewards:
                continue
            processed_rewards.add((line.reward_id, line.reward_identifier_code))
            concerned_lines = self.order_line.filtered(lambda l:\
                l.reward_id == line.reward_id and\
                l.coupon_id == line.coupon_id and\
                l.reward_identifier_code == line.reward_identifier_code)
            additional_points = sum(concerned_lines.mapped('points_cost')) if not line.points_cost else\
                                    line.points_cost
            points = self._get_real_points_for_coupon(line.coupon_id) + additional_points
            # This works for both points being negative and not having enough points for the reward
            if points < line.reward_id.required_points:
                if block:
                    return {'error': _('One of the rewards on the sales order can not be claimed due to a lack of points.')}
                # Not adding concerned_lines since it is implicit
                lines_to_remove |= line
            else:
                values_list = self._get_reward_line_values(line.reward_id, line.coupon_id, additional_points=additional_points)
                for values in values_list:
                    # We do not want to update the identifier
                    values.pop('reward_identifier_code')
                if len(concerned_lines) == 1 and len(values) == 1:
                    concerned_lines.write(values[0])
                else:
                    value_lines_to_remove = concerned_lines
                    for values in values_list:
                        values_taxes = set(v[1] for v in values.get('tax_id'))
                        # 3 cases we want to handle
                        # 1: a line already exists with the exact same taxes, update that line
                        # 2: no line was found in the existing line, create a new line
                        # 3: line not matching with anything in values_list, delete line
                        for value_line in concerned_lines:
                            if not set(value_line.tax_id.ids).symmetric_difference(values_taxes):
                                value_lines_to_remove -= value_line
                                # case 1
                                if values['product_uom_qty'] and values['price_unit']:
                                    line_updates.append((Command.UPDATE, value_line.id, values))
                                else:
                                    if line.reward_id.reward_type == 'shipping':
                                        values.update(price_unit=0)
                                        line_updates.append((Command.UPDATE, value_line.id, values))
                                    else:
                                        line_updates.append((Command.DELETE, value_line.id))
                                break
                        else:
                            # case 2
                            line_updates.append((Command.CREATE, 0, values))
                    # case 3
                    line_updates.extend((Command.DELETE, remove_line.id) for remove_line in value_lines_to_remove)
        if line_updates:
            self.write({'order_line': line_updates})
        if lines_to_remove:
            # Done separately to avoid concurrent changes
            lines_to_remove.unlink()


    def _get_points_programs(self):
        """
        Returns all programs that give points on the current order.
        """
        self.ensure_one()
        return self.coupon_point_ids.coupon_id.program_id

    def _get_reward_programs(self):
        """
        Returns all programs that are being used for rewards.
        """
        self.ensure_one()
        return self.order_line.reward_id.program_id

    def _get_reward_coupons(self):
        """
        Returns all coupons that are a reward.
        """
        self.ensure_one()
        return self.coupon_point_ids.coupon_id.filtered(lambda c: c.program_id.applies_on == 'future')

    def _get_applied_programs(self):
        """
        Returns all applied programs on current order.

        Applied programs is the combination of both new points for your order and the programs linked to rewards.
        """
        self.ensure_one()
        return self._get_points_programs() | self._get_reward_programs()

    def _get_invoice_status(self):
        # Handling of a specific situation: an order contains
        # a product invoiced on delivery and a promo line invoiced
        # on order. We would avoid having the invoice status 'to_invoice'
        # if the created invoice will only contain the promotion line
        super()._get_invoice_status()
        for order in self.filtered(lambda order: order.invoice_status == 'to invoice'):
            # TODO: check how this should be handled since free product are now product lines with price = 0
            paid_lines = order._get_paid_order_lines()
            if not any(line.invoice_status == 'to invoice' for line in paid_lines):
                order.invoice_status = 'no'

    def _get_invoiceable_lines(self, final=False):
        """ Ensures we cannot invoice only reward lines.

        Since promotion lines are specified with service products,
        those lines are directly invoiceable when the order is confirmed
        which can result in invoices containing only promotion lines.

        To avoid those cases, we allow the invoicing of promotion lines
        iff at least another 'basic' lines is also invoiceable.
        """
        # TODO: check how this should be handled since free product are now product lines with price = 0
        #  does it make sense to invoice a free product anyway?
        invoiceable_lines = super()._get_invoiceable_lines(final)
        reward_lines = self._get_reward_lines()
        if invoiceable_lines <= reward_lines:
            return self.env['sale.order.line'].browse()
        return invoiceable_lines

    def update_prices(self):
        """Recompute coupons/promotions after pricelist prices reset."""
        super().update_prices()
        if any(line.is_reward_line for line in self.order_line):
            self._check_update_applied_rewards()

    def _get_point_changes(self):
        """
        Returns the changes in points per coupon as a dict.

        Used when validating/cancelling an order
        """
        points_per_coupon = defaultdict(lambda: 0)
        for coupon_point in self.coupon_point_ids:
            points_per_coupon[coupon_point.coupon_id] += coupon_point.points
        for line in self.order_line:
            if not line.reward_id or not line.coupon_id:
                continue
            points_per_coupon[line.coupon_id] -= line.points_cost
        return points_per_coupon

    def _get_real_points_for_coupon(self, coupon):
        """
        Returns the actual points usable for this coupon for this order.

        This is calculated by taking the points on the coupon, the points the order will give to the coupon (if applicable) and removing the points taken by already applied rewards
        """
        self.ensure_one()
        points = coupon.points
        if coupon.program_id.applies_on != 'future':
            # Points that will be given by the order upon confirming the order
            points += self.coupon_point_ids.filtered(lambda p: p.coupon_id == coupon).points
        # Points already used by rewards
        points -= sum(self.order_line.filtered(lambda l: l.coupon_id == coupon).mapped('points_cost'))
        return points

    def _add_points_for_coupon(self, coupon, points):
        """
        Updates (or creates) an entry in coupon_point_ids for the given coupon.

        Returns the new total of points.
        """
        self.ensure_one()
        # NOTE: sudo -> salesman don't have create rights, only read
        point_entry = self.coupon_point_ids.filtered(lambda p: p.coupon_id == coupon).sudo()
        if not point_entry:
            point_entry = self.env['sale.order.coupon.points'].sudo().create({
                'coupon_id': coupon.id,
                'order_id': self.id,
                'points': points,
            })
            self.coupon_point_ids += point_entry
        else:
            point_entry.points += points
        return coupon.points + point_entry.points

    def _remove_program_from_points(self, programs):
        self.coupon_point_ids.filtered(lambda p: p.coupon_id.program_id in programs).sudo().unlink()

    def _get_reward_line_values(self, reward, coupon, **kwargs):
        self.ensure_one()
        self = self.with_context(lang=self.partner_id.lang)
        reward = reward.with_context(lang=self.partner_id.lang)
        if reward.reward_type == 'discount':
            return self._get_reward_values_discount(reward, coupon, **kwargs)
        elif reward.reward_type == 'product':
            return self._get_reward_values_product(reward, coupon, **kwargs)

    def _apply_program_reward(self, reward, coupon, **kwargs):
        """
        Applies the reward to the order provided the given coupon has enough points.
        This method does not check for program rules.

        This method also assumes the points added by the program triggers have already been computed.
        The temporary points are used if the program is applicable to the current order.

        Returns a dict containing the error message or empty if everything went correctly.
        """
        self.ensure_one()
        if reward.is_global_discount and self._is_global_discount_already_applied():
            return {'error': _('Global discounts are not cumulative.')}
        elif reward.program_id.applies_on == 'future' and coupon in self.coupon_point_ids:
            return {'error': _('The coupon can only be claimed on future orders.')}
        elif self._get_real_points_for_coupon(coupon) < reward.required_points:
            return {'error': _('The coupon does not have enough points for the selected reward.')}
        self.write({'order_line': [(0, False, value) for value in self._get_reward_line_values(reward, coupon, **kwargs)]})
        return {}

    def _program_check_compute_points(self, program):
        """
        Checks the program validity from the order lines aswell as computing the number of points to add.

        Returns a dict containing the error message or the points that will be given with the keys 'points' and 'future_points'.
        """
        self.ensure_one()
        # The computing of points will be pretty naïve; if two rules contain the same product
        #  the amount of points they will give will be counted twice.
        no_effect_lines = self._get_no_effect_on_threshold_lines()
        program_reward_discount_product_ids = program.reward_ids.discount_line_product_id

        # Do not count this program's discount lines for the amount to check.
        discount_lines = self.order_line.filtered(lambda line: line.product_id in program_reward_discount_product_ids)
        untaxed_amount = self.amount_untaxed - sum(line.price_subtotal for line in no_effect_lines) - sum(line.price_subtotal for line in discount_lines)
        tax_amount = self.amount_tax - sum(line.price_tax for line in no_effect_lines) - sum(line.price_tax for line in discount_lines)

        # Check quantities
        reward_lines = self._get_reward_lines()
        order_lines = self.order_line.filtered(lambda line: line.product_id) - reward_lines
        products = order_lines.product_id
        products_qties = dict.fromkeys(products, 0)
        for line in order_lines:
            products_qties[line.product_id] += line.product_uom_qty
        # Contains the products that can be applied per rule
        products_per_rule = program._get_valid_products(products)

        # Used for error messages
        minimum_amount_matched = False
        product_qty_matched = False
        points = 0
        result = {}
        for rule in program.rule_ids:
            rule_amount = rule._compute_amount(self.currency_id)
            if rule.minimum_amount_tax_mode == 'incl' and rule_amount > (untaxed_amount + tax_amount) or rule_amount > untaxed_amount:
                continue
            minimum_amount_matched = True
            rule_products = products_per_rule[rule]
            ordered_rule_products_qty = sum(products_qties[product] for product in rule_products)
            # if ordered_rule_products_qty < rule.minimum_qty and program.applies_on != 'both':
            if ordered_rule_products_qty < rule.minimum_qty:
                continue
            product_qty_matched = True
            if not rule.reward_point_amount:
                continue
            # Count all points separately if the order is for the future and the split option is enabled
            if not (program.applies_on == 'future' and rule.reward_point_trigger_multi) or rule.reward_point_mode == 'order':
                # All checks have been passed we can now compute the points to give
                if rule.reward_point_mode == 'order':
                    points += rule.reward_point_amount
                elif rule.reward_point_mode == 'money':
                    # Compute amount paid for rule
                    # NOTE: this does not account for discounts -> 1 point per $ * 100$ - 30% will result in 100$
                    amount_paid = sum(max(0, line.price_total) for line in order_lines if line.product_id in rule_products)
                    points += (rule.reward_point_amount * amount_paid) // 1
                elif rule.reward_point_mode == 'unit':
                    points += rule.reward_point_amount * ordered_rule_products_qty
            else:
                if rule.reward_point_mode == 'unit':
                    result[rule] = [rule.reward_point_amount for _ in range(ordered_rule_products_qty)]
                elif rule.reward_point_mode == 'money':
                    rule_result = []
                    for line in self.order_line:
                        if line.is_reward_line:
                            continue
                        points_per_unit = (rule.reward_point_amount * line.price_total / line.product_uom_qty) // 1
                        if not points_per_unit:
                            continue
                        rule_result.extend(points_per_unit for _ in range(line.product_uom_qty))
                    result[rule] = rule_result


        if not minimum_amount_matched:
            return {'error': _(
                'A minimum of %(amount)s %(currency)s should be purchased to get the reward',
                amount=min(program.rule_ids.mapped('rule_minimum_amount')),
                currency=program.currency_id.name,
            )}
        elif not product_qty_matched:
            return {'error': _("You don't have the required product quantities on your sales order. If the reward is same product quantity, please make sure that all the products are recorded on the sales order (Example: You need to have 3 T-shirts on your sales order if the promotion is 'Buy 2, Get 1 Free'.")}
        result['points'] = points
        return result

    def _try_apply_program(self, program, coupon=None):
        """
        Tries to apply a program using the coupon if provided.

        This function provides the full routine to apply a program, it will check for applicability
        aswell as creating the necessary coupons and co-models to give the points to the customer.

        This function does not apply any reward to the order, rewards have to be given manually.

        Returns a dict containing the error message or containing the associated coupon(s).
        """
        self.ensure_one()
        # Basic checks
        if not program._is_valid_partner(self.partner_id):
            return {'error': _('The customer does not have access to this reward.')}
        # Check for applicability from the program's triggers/rules.
        # This step should also compute the amount of points to give for that program on that order.
        status = self._program_check_compute_points(program)
        if 'error' in status:
            return status
        # The program is applicable to this order, we now have to create (or fetch) a coupon that will
        #  store the points to be used on this order or future orders
        points = status['points']
        # If coupon is already set we can assume the code was one of a coupon,
        #  in that case since we know the program is applicable to the order, we can just check if enough points
        #  are present for the reward, this only makes sense for future (or both) programs
        coupons = coupon or self.env['loyalty.card']
        if not coupon:
            # If the program only applies on the current order it does not make sense to fetch already existing coupons
            if program.applies_on == 'both':
                # Programs with 'both' have to be nominative
                coupon = self.env['loyalty.card'].search(
                    [('partner_id', '=', self.partner_id.id), ('program_id', '=', program.id)], limit=1)
            if program.applies_on in ('future', 'current') or not coupon:
                # Special case where multiple coupons are generated for the order to be used in a future order
                # (i.e. Gift Cards)
                if program.applies_on == 'future':
                    for rule, rule_points in status.items():
                        if isinstance(rule, str):
                            continue
                        new_coupons = self.env['loyalty.card'].sudo().create([{
                            'program_id': program.id,
                            'partner_id': self.partner_id.id,
                            'shared_code': False,
                            'points': 0,
                            'order_id': self.id,
                        } for _ in rule_points])
                        for x, coupon in enumerate(new_coupons):
                            self._add_points_for_coupon(coupon, x)
                        coupons |= new_coupons
                coupon = self.env['loyalty.card'].sudo().create({
                    'program_id': program.id,
                    'partner_id': self.partner_id.id,
                    'shared_code': True if program.code else False,
                    'code': program.code or self.env['loyalty.card']._generate_code(),
                    'points': 0, #NOTE: use `_get_real_points_for_coupon` to get the points for this order
                    'order_id': self.id if program.applies_on == 'future' else False,
                })
                coupons |= coupon
        self._add_points_for_coupon(coupon, points)
        return {'coupon': coupons}

    def _try_apply_code(self, code):
        """
        Tries to apply a promotional code to the sales order.

        Returns a dict containing the error message or empty if everything went correctly.
        """
        self.ensure_one()
        program = self.env['loyalty.program'].search([('code', '=', code), ('trigger', '=', 'with_code')])
        coupon = None
        if not program:
            # Ordering by partner id to use the first assigned to the partner in case multiple coupons have the same code
            #  it could happen with loyalty programs using a code
            # Points desc so that in coupon mode one could use a coupon multiple times
            coupon = self.env['loyalty.card'].search(
                [('partner_id', 'in', (False, self.partner_id.id), ('code', '=', code))],
                order='partner_id, points desc', limit=1)
            # TODO: validate coupon (expiration date etc)
            if not coupon or not coupon.program_id.active:
                return {'not_found': _('This code is invalid (%s).', code)}
            program = coupon.program_id
        if program.code and program.code == self.promo_code:
            return {'error': _('The promo code is already applied on this order.')}
        elif not coupon and self.promo_code and program.trigger == 'with_code': # TODO: check this condition
            return {'error': _('Promotional codes are not cumulative.')}
        elif program in self.no_code_promo_program_ids:
            return {'error': _('The promotional offer is already applied on this order.')}
        return self._try_apply_program(program, coupon)
