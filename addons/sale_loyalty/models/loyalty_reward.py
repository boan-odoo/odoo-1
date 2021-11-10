# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models

class LoyaltyReward(models.Model):
    _inherit = 'loyalty.reward'

    is_global_discount = fields.Boolean(compute='_compute_is_global_discount')

    @api.depends('reward_type', 'discount_applicability', 'discount_mode')
    def _compute_is_flobal_discount(self):
        for reward in self:
            reward.is_global_discount = reward.reward_type == 'discount' and\
                                        reward.discount_applicability == 'order' and\
                                        reward.discount_mode == 'percent'

    def _get_discount_product_values(self):
        res = super()._get_discount_product_values()
        res.update({
            'taxes_id': False,
            'supplier_taxes_id': False,
            'invoice_policy': 'order',
        })
        return res
