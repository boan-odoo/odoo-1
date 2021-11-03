# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models
from babel.dates import format_datetime

#TODO: Most of this file's functions are unused
class LoyaltyProgram(models.Model):
    _inherit = 'loyalty.program'

    order_count = fields.Integer(compute='_compute_order_count')
    is_global_discount = fields.Boolean(compute='_compute_is_global_discount')

    # The api.depends is handled in `def modified` of `sale_coupon/models/sale_order.py`
    def _compute_order_count(self):
        #TODO: optimize using read_group
        for program in self:
            program.order_count = self.env['sale.order.line'].search_count([('product_id', 'in', program.reward_ids.discount_line_product_id.id)])

    def action_view_sales_orders(self):
        self.ensure_one()
        orders = self.env['sale.order.line'].search([('product_id', '=', self.reward_id.discount_line_product_id.id)]).mapped('order_id')
        return {
            'name': _('Sales Orders'),
            'view_mode': 'tree,form',
            'res_model': 'sale.order',
            'search_view_id': [self.env.ref('sale.sale_order_view_search_inherit_quotation').id],
            'type': 'ir.actions.act_window',
            'domain': [('id', 'in', orders.ids)],
            'context': dict(self._context, create=False),
        }

    def _check_promo_code(self, order, coupon_code):
        self.ensure_one()
        message = {}
        # if self.maximum_use_number != 0 and self.total_order_count >= self.maximum_use_number:
        #     message = {'error': _('Promo code %s has been expired.') % (coupon_code)}
        if not self._filter_on_mimimum_amount(order):
            message = {'error': _(
                'A minimum of %(amount)s %(currency)s should be purchased to get the reward',
                amount=self.rule_minimum_amount,
                currency=self.currency_id.name
            )}
        # elif self.promo_code and self.promo_code == order.promo_code:
        #     message = {'error': _('The promo code is already applied on this order')}
        # elif self in order.no_code_promo_program_ids:
        #     message = {'error': _('The promotional offer is already applied on this order')}
        # elif not self.active:
        #     message = {'error': _('Promo code is invalid')}
        # elif self.rule_date_from and self.rule_date_from > fields.Datetime.now():
        #     tzinfo = self.env.context.get('tz') or self.env.user.tz or 'UTC'
        #     locale = self.env.context.get('lang') or self.env.user.lang or 'en_US'
        #     message = {'error': _('This coupon is not yet usable. It will be starting from %s') % (format_datetime(self.rule_date_from, format='short', tzinfo=tzinfo, locale=locale))}
        # elif self.rule_date_to and fields.Datetime.now() > self.rule_date_to:
        #     message = {'error': _('Promo code is expired')}
        # elif order.promo_code and self.promo_code_usage == 'code_needed':
        #     message = {'error': _('Promotionals codes are not cumulative.')}
        # elif self.is_global_discount and order._is_global_discount_already_applied():
        #     message = {'error': _('Global discounts are not cumulative.')}
        #TODO: do we need to handle multiple reward_types?
        elif self.promo_applicability in ('both', 'current') and\
             all(reward.reward_type == 'product' for reward in self.reward_ids) and\
             not order._is_reward_in_order_lines(self):
            message = {'error': _('The reward products should be in the sales order lines to apply the discount.')}
        # elif not self._is_valid_partner(order.partner_id):
        #     message = {'error': _("The customer doesn't have access to this reward.")}
        elif not self._filter_programs_on_products(order):
            message = {'error': _("You don't have the required product quantities on your sales order. If the reward is same product quantity, please make sure that all the products are recorded on the sales order (Example: You need to have 3 T-shirts on your sales order if the promotion is 'Buy 2, Get 1 Free'.")}
        elif self.promo_applicability in ('both', 'current') and not self.env.context.get('applicable_coupon'):
            applicable_programs = order._get_applicable_programs()
            if self not in applicable_programs:
                message = {'error': _('At least one of the required conditions is not met to get the reward!')}
        return message

    def _filter_on_mimimum_amount(self, order):
        no_effect_lines = order._get_no_effect_on_threshold_lines()
        order_amount = {
            'amount_untaxed' : order.amount_untaxed - sum(line.price_subtotal for line in no_effect_lines),
            'amount_tax' : order.amount_tax - sum(line.price_tax for line in no_effect_lines)
        }
        program_ids = list()
        for program in self:
            if not any(reward.reward_type == 'discount' for reward in program.reward_ids):
                lines = self.env['sale.order.line']
            else:
                discount_line_products = program.reward_ids.discount_line_product_id
                lines = order.order_line.filtered(lambda line:
                    line.product_id in discount_line_products or
                    line.is_reward_line)
            untaxed_amount = order_amount['amount_untaxed'] - sum(line.price_subtotal for line in lines)
            tax_amount = order_amount['amount_tax'] - sum(line.price_tax for line in lines)
            for rule in program.rule_ids:
                rule_amount = rule._compute_amount(order.currency_id)
                if rule.minimum_amount_tax_mode == 'incl' and rule_amount <= (untaxed_amount + tax_amount) or rule_amount <= untaxed_amount:
                    program_ids.append(program.id)
                    break

        return self.browse(program_ids)

    def _filter_promo_programs_with_code(self, order):
        '''Filter Promo program with code with a different promo_code if a promo_code is already ordered'''
        return self.filtered(lambda program: program.trigger == 'with_code' and program.promo_code != order.promo_code)

    def _filter_programs_on_partners(self, order):
        return self.filtered(lambda program: program._is_valid_partner(order.partner_id))

    def _filter_programs_on_products(self, order):
        """
        To get valid programs according to product list.
        i.e Buy 1 imac + get 1 ipad mini free then check 1 imac is on cart or not
        or  Buy 1 coke + get 1 coke free then check 2 cokes are on cart or not
        """
        order_lines = order.order_line.filtered(lambda line: line.product_id) - order._get_reward_lines()
        products = order_lines.mapped('product_id')
        products_qties = dict.fromkeys(products, 0)
        for line in order_lines:
            products_qties[line.product_id] += line.product_uom_qty
        valid_program_ids = list()
        for program in self:
            products_per_rule = program._get_valid_products(products)
            if any(rule.minimum_qty == 0 and rule_products for rule, rule_products in products_per_rule.items()):
                valid_program_ids.append(program.id)
                continue
            product_reward_qties = dict()
            if program.applies_on in ('both', 'current'):
                for reward in program.reward_ids:
                    if reward.reward_type == 'product':
                        product_reward_qties[reward.reward_product_id] = reward.reward_product_qty
            # Check if we match any trigger from our program
            for rule, rule_products in products_per_rule.items():
                if not rule_products:
                    continue
                ordered_rule_products_qty = sum(products_qties[product] for product in rule_products)
                # Avoid program if 1 ordered foo on a program '1 foo, 1 free foo'
                if product_reward_qties:
                    for product, qties in product_reward_qties.items():
                        if product in rule_products:
                            ordered_rule_products_qty -= qties
                if rule.minimum_qty < ordered_rule_products_qty:
                    valid_program_ids.append(program.id)
                    break
        return self.browse(valid_program_ids)

    def _filter_not_ordered_reward_programs(self, order):
        """
        Returns the programs when the reward is actually in the order lines
        """
        programs = self.env['coupon.program']
        for program in self:
            for reward in program.reward_ids:
                if reward.reward_type == 'product' and \
                not order.order_line.filtered(lambda line: line.product_id == reward.reward_product_id):
                    continue
                elif reward.reward_type == 'discount' and reward.discount_applicability == 'specific' and \
                not order.order_line.filtered(lambda line: line.product_id in reward.discount_product_ids):
                    continue
                programs |= program
                break
        return programs

    def _filter_programs_from_common_rules(self, order, next_order=False):
        """ Return the programs if every conditions is met
            :param bool next_order: is the reward given from a previous order
        """
        programs = self
        # Minimum requirement should not be checked if the coupon got generated by a promotion program (the requirement should have only be checked to generate the coupon)
        if not next_order:
            programs = programs and programs._filter_on_mimimum_amount(order)
        programs = programs and programs._filter_programs_on_partners(order)
        # Product requirement should not be checked if the coupon got generated by a promotion program (the requirement should have only be checked to generate the coupon)
        if not next_order:
            programs = programs and programs._filter_programs_on_products(order)

        programs_curr_order = programs.filtered(lambda p: p.promo_applicability in ('both', 'current'))
        programs = programs.filtered(lambda p: p.promo_applicability in ('both', 'future'))
        if programs_curr_order:
            # Checking if rewards are in the SO should not be performed for rewards on_next_order
            programs += programs_curr_order._filter_not_ordered_reward_programs(order)
        return programs

    def _get_discount_product_values(self):
        res = super()._get_discount_product_values()
        res['invoice_policy'] = 'order'
        return res

    @api.depends(
        'applies_on', 'reward_ids.reward_type',
        'reward_ids.discount_mode', 'reward_ids.discount_applicability')
    def _compute_is_global_discount(self):
        #TODO: how do we handle a program with multiple reward types?
        for program in self:
            program.is_global_discount = program.applies_on in ('both', 'current') and \
               all(reward.reward_type == 'discount' for reward in program.reward_ids) and \
               all(reward.discount_mode == 'percent' for reward in program.reward_ids) and \
               all(reward.discount_applicability == 'order' for reward in program.reward_ids)

    def _keep_only_most_interesting_auto_applied_global_discount_program(self):
        '''Given a record set of programs, remove the less interesting auto
        applied global discount to keep only the most interesting one.
        We should not take promo code programs into account as a 10% auto
        applied is considered better than a 50% promo code, as the user might
        not know about the promo code.
        '''
        programs = self.filtered(lambda p: p.is_global_discount and p.trigger == 'auto')
        if not programs:
            return self
        most_interesting_program = max(programs, key=lambda p: max(p.reward_ids.mapped('discount')))
        # remove least interesting programs
        return self - (programs - most_interesting_program)

    # The api.depends is handled in `def modified` of `sale_coupon/models/sale_order.py`
    def _compute_total_order_count(self):
        super()._compute_total_order_count()
        for program in self:
            program.total_order_count += program.order_count
