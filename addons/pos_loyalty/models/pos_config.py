# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models
from odoo.exceptions import UserError

class PosConfig(models.Model):
    _inherit = 'pos.config'

    use_coupon_programs = fields.Boolean('Coupons & Promotions',
        help="Use coupon and promotion programs in this PoS configuration.")
    coupon_program_ids = fields.Many2many(
        'loyalty.program', string="Coupon Programs", domain=[('program_type', '=', 'coupons')])
    promo_program_ids = fields.Many2many(
        'loyalty.program', string="Promotion Programs", domain=[('program_type', '=', 'promotion')]
    )

    use_loyalty_programs = fields.Boolean('Loyalty Program')
    loyalty_program_ids = fields.Many2many('loyalty.program', "PoS Loyalty Programs", domain=[('program_type', '=', 'loyalty')])

    use_gift_card = fields.Boolean('Gift Cards')
    gift_card_program_id = fields.Many2one('loyalty.program', "PoS Gift Card Program", domain=[('program_type', '=', 'gift_card')])

    # While we select all program types separately they will all behave the same
    all_program_ids = fields.Many2many('loyalty.program', '_compute_all_programs')

    @api.depends('use_coupon_programs', 'coupon_program_ids', 'promo_program_ids',
        'use_loyalty_program', 'loyalty_program_ids',
        'use_gift_card', 'gift_card_program_id')
    def _compute_all_programs(self):
        for config in self:
            programs = self.env['loyalty.program']
            if config.use_coupon_programs:
                programs |= config.coupon_program_ids
                programs |= config.promo_program_ids
            # This may be a separate field on the config but it actually will be handled just like any other program
            if config.use_loyalty_programs:
                programs |= config.loyalty_program_ids
            # We also include the gift card program to be able to claim the reward (discount)
            # This one will behave a little differently as it will display more options
            if config.use_gift_card:
                programs |= config.gift_card_program_id
            config.all_program_ids = programs

    def open_session_cb(self, check_coa=True):
        self.ensure_one()
        # Check validity of programs before opening a new session
        invalid_reward_products_msg = ''
        for reward in self.all_program_ids.reward_ids:
            if reward.reward_type == 'product':
                for product in reward._get_reward_products():
                    if product.available_in_pos:
                        continue
                    invalid_reward_products_msg += "\n\t"
                    invalid_reward_products_msg += _(
                        "Program: %(name)s, Reward Product: `%(reward_product)s`",
                        name=reward.program_id.name,
                        reward_product=product.name,
                    )
        if invalid_reward_products_msg:
            prefix_error_msg = _("To continue, make the following reward products available in Point of Sale.")
            raise UserError(f"{prefix_error_msg}\n{invalid_reward_products_msg}")
        if self.use_gift_card and self.gift_card_program_id:
            # Do not allow gift_card_program_id with more than one rule or reward, and check that they make sense
            gc_program = self.gift_card_program_id
            if len(gc_program.reward_ids) > 1:
                raise UserError(_('Invalid gift card program. More than one reward.'))
            elif len(gc_program.rule_ids) > 1:
                raise UserError(_('Invalid gift card program. More than one rule.'))
        return super().open_session_cb(check_coa)

    def use_coupon_code(self, code, creation_date, partner_id):
        # TODO: some conditions are missing due to the drop of `_check_coupon_code`
        self.ensure_one()
        # Ordering by partner id to use the first assigned to the partner in case multiple coupons have the same code
        #  it could happen with loyalty programs using a code
        # Points desc so that in coupon mode one could use a coupon multiple times
        coupon = self.env['loyalty.card'].search(
            [('program_id', 'in', self.all_program_ids), ('partner_id', 'in', (False, partner_id)), ('code', '=', self.promo_code)],
            order='partner_id, points desc', limit=1)
        if not coupon or not coupon.program_id.active:
            return {
                'successful': False,
                'payload': {
                    'error_message': _('This coupon is invalid (%s).', code),
                },
            }
        check_date = fields.Date.from_string(creation_date[:11])
        if coupon.expiration_date and coupon.expiration_date < check_date:
            return {
                'successful': False,
                'payload': {
                    'error_message': _('This coupon is expired.'),
                },
            }
        if not any(reward.required_points < coupon.points for reward in coupon.program_id.reward_ids):
            return {
                'successful': False,
                'payload': {
                    'error_message': _('No reward can be claimed with this coupon.'),
                },
            }
        return {
            'successful': True,
            'payload': {
                'program_id': coupon.program_id.id,
                'coupon_id': coupon.id,
                'coupon_partner_id': coupon.partner_id.id,
                'points': coupon.points,
            },
        }
