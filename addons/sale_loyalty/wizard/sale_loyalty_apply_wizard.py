# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError
from odoo.fields import Command
from odoo.osv import expression

class SaleLoyaltyApplyWizard(models.TransientModel):
    _name = 'sale.loyalty.apply.wizard'
    _description = 'Sale Loyalty - Apply Programs'

    # This wizard is responsible to start loyalty programs on a sales order, as while they are
    #  'automatic' they wont need a code to be visible in the wizard but will require manual input
    #  to claim a reward

    order_id = fields.Many2one('sale.order', default=lambda self: self.env.context.get('active_id'), required=True)
    promo_code = fields.Char()

    line_ids = fields.One2many('sale.loyalty.apply.wizard.line', 'wizard_id', 'Lines',
        help="""
        All the programs that will be applied to the order.

        Leave without reward to just count the points (for loyalty cards).
        """)

    def _action_open_self(self):
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'target': 'new',
            'context': self.env.context,
            'res_model': self._name,
            'res_id': self.id,
            'view_mode': 'form',
        }

    def action_use_code(self):
        self.ensure_one()
        if not self.promo_code:
            raise ValidationError(_('Please input a code.'))
        # This function will check the promo code input and create a new line if applicable and consume the input
        base_domain = self.order_id._get_program_domain()
        domain = expression.AND([base_domain, [('code', '=', self.promo_code), ('trigger', '=', 'with_code')]])
        program = self.env['loyalty.program'].search(domain)
        coupon = self.env['loyalty.card']
        if not program:
            # Ordering by partner id to use the first assigned to the partner in case multiple coupons have the same code
            #  it could happen with loyalty programs using a code
            # Points desc so that in coupon mode one could use a coupon multiple times
            coupon = self.env['loyalty.card'].search(
                [('partner_id', 'in', (False, self.order_id.partner_id.id)), ('code', '=', self.promo_code)],
                order='partner_id, points desc', limit=1)
            if coupon.expiration_date and coupon.expiration_date < fields.Date.today():
                raise ValidationError(_('This coupon is expired.'))
            if not coupon or not coupon.program_id.active or not coupon.program_id.filtered_domain(base_domain):
                raise ValidationError(_('This code is invalid (%s).', self.promo_code))
            program = coupon.program_id
        if program and program.applies_on == 'both':
            # Fetch loyalty card if it exists
            coupon = self.env['loyalty.card'].search(
                [('partner_id', '=', self.order_id.partner_id.id), ('program_id', '=', program.id)], limit=1)
        # Using a promotional code or a coupon code will behave differently
        #  -> current program: giving coupon code acts as if the program's code was given, check applicability + apply reward
        #  -> future program: giving coupon code means apply reward, no need to verify for program applicability
        #  -> current & future program: (should probably not use code but) code should be usable as long as program rules are applicable
        if not program or not program.filtered_domain(base_domain):
            raise ValidationError(_('This code is invalid (%s).', self.promo_code))
        points = coupon.points or 0
        if program.applies_on in ('current', 'both') or not coupon:
            program_points = self.order_id._program_check_compute_points(program)
            if 'error' in program_points and (program.applies_on == 'current' or not coupon):
                raise ValidationError(program_points['error'])
            else:
                points += program_points.get('points', 0)
        if (program.applies_on == 'current' or (program.applies_on == 'future' and coupon))\
            and not any(reward.required_points <= points for reward in program.reward_ids):
            raise ValidationError(_('No reward can be claimed with this coupon.'))
        self.write({'line_ids': [(Command.CREATE, 0, {
            'program_id': program.id,
            'coupon_id': coupon.id,
            # Use reward directly if there is only one and the program is not current&future
            'reward_id': program.reward_ids.id if coupon and len(program.reward_ids) == 1 and not program.applies_on == 'both'\
                        else False,
            'points': points,
        })]})
        self.promo_code = False
        # It would otherwise close the wizard
        return self._action_open_self()

    def action_make_auto(self):
        self.ensure_one()
        # This function will create a new wizard line for every 'automatic' programs that are applicable
        #  OR if they apply to current&future AND enough points are available for a reward
        # Automatic programs using future mean you create a coupon for a future order
        applied_programs = self.order_id._get_applied_programs()
        if applied_programs:
            domain = ['|', ('id', 'not in', applied_programs.ids), ('applies_on', '=', 'both'), ('trigger', '=', 'auto')]
        else:
            domain = None
        newly_applicable_program_points = self.order_id._get_applicable_programs_points(domain)
        domain = expression.AND([self.order_id._get_program_domain(), domain,
            [('id', 'not in', tuple(k.id for k in newly_applicable_program_points.keys())), ('applies_on', '=', 'both')]])
        # Programs that could be applicable if enough points exists on their card
        current_future_programs = self.env['loyalty.program'].search(domain)
        for program in current_future_programs:
            newly_applicable_program_points[program] = -1
        # Fetch the coupons for current & future programs, they should be nominative and there should be only one card per customer
        coupons = self.env['loyalty.card'].search([
            ('partner_id', '=', self.order_id.partner_id.id),
            ('program_id', 'in', tuple(k.id for k in newly_applicable_program_points.keys()\
                if k.applies_on == 'both'))])
        coupons_per_program = {c.program_id: c for c in coupons}
        line_ids_update_vals = []
        for program, points in newly_applicable_program_points.items():
            coupon = coupons_per_program.get(program, self.env['loyalty.card'])
            points += self.order_id._get_real_points_for_coupon(coupon)
            line_ids_update_vals.append((Command.CREATE, 0, {
                'program_id': program.id,
                'coupon_id': coupon.id,
                'reward_id': program.reward_ids.id if len(program.reward_ids) == 1 and\
                                                        (program.applies_on == 'current' or coupon) and\
                                                        program.reward_ids.required_points <= points\
                                else False,
                'points': points,
            }))
        if line_ids_update_vals:
            self.write({'line_ids': line_ids_update_vals})
        # It would otherwise close the wizard
        return self._action_open_self()

    def action_confirm(self):
        self.ensure_one()
        order = self.order_id
        already_applied_programs = order._get_applied_programs()
        # TODO: look into _keep_only_most_interesting_auto_applied_global_discount_program
        for line in self.line_ids:
            program = line.program_id
            coupon = line.coupon_id
            already_applied = bool(program in already_applied_programs)
            # Apply program if not applied already, prevent applying program if program is type future and coupon exists
            #  ^ it means that we only want the reward.
            if not already_applied and not (program.applies_on == 'future' and coupon):
                status = order._try_apply_program(program, line.coupon_id)
                # In some cases it does not matter if the program is not applicable
                if 'error' in status and (program.applies_on != 'both' or line.coupon_id):
                    raise ValidationError(status['error'])
                if not coupon:
                    coupon = status.get('coupon', False)
                already_applied_programs |= program
            if line.reward_id:
                if not coupon:
                    raise ValidationError(_('Coupon/Loyalty card not found for reward %s.', line.reward_id.display_name))
                status = order._apply_program_reward(line.reward_id, coupon, product=line.forced_product_id)
                if 'error' in status:
                    raise ValidationError(status['error'])
        return True
