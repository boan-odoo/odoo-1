# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models

class SaleLoyaltyApplyWizardLine(models.TransientModel):
    _name = 'sale.loyalty.apply.wizard.line'
    _description = 'Sale Loyalty - Apply Program Line'

    # These lines will contain all programs to be applied to the order, regardless of reward,
    #  in some cases the program will not be applied for new points
    #  i.e. for future or current & future programs we can totally apply a reward without the order fitting the program's triggers
    # If a reward is present, the reward is also applied to the order
    # While the wizard will try to make sure no invalid configuration is made it is not guaranteed
    # Additional verifications are made when confirming the loyalty programs

    wizard_id = fields.Many2one('sale.loyalty.apply.wizard', required=True)
    order_id = fields.Many2one(related='wizard_id.order_id')

    program_id = fields.Many2one('loyalty.program', required=True)
    coupon_id = fields.Many2one('loyalty.card')
    reward_id = fields.Many2one('loyalty.reward', domain="[('program_id', '=', program_id), ('required_points', '<=', points)]")
    code = fields.Char(readonly=True)

    require_reward = fields.Boolean(compute='_compute_require_reward')
    no_reward = fields.Boolean(compute='_compute_required_reward')

    # -1 -> means we can only apply a reward not counting points
    # otherwise ->
    #  if a coupon was found -> order._get_real_points(coupon) + points the program will give
    #  else -> poinst the program will give
    points = fields.Float()

    # Used when a reward is reward_type == 'product' and multi_product
    multi_product = fields.Boolean(related='reward_id.multi_product')
    require_product = fields.Boolean(compute='_compute_forced_product_id')
    forced_product_id = fields.Many2one('product.product', compute='_compute_forced_product_id')

    @api.depends('program_id')
    def _compute_require_reward(self):
        # In some cases we want to force the selection of a reward
        for line in self:
            # TODO: are there more conditions?
            line.require_reward = bool(line.program_id.applies_on in ('current', 'future') and line.coupon_id)
            line.no_reward = bool(line.program_id.applies_on == 'future' and not line.coupon_id)

    @api.depends('reward_id')
    def _compute_forced_product_id(self):
        for line in self:
            line.require_product = line.reward_id.reward_type == 'product'
            if not line.require_product:
                line.forced_product_id = False
            else:
                line.forced_product_id = line.reward_id._get_reward_products()[:1]
