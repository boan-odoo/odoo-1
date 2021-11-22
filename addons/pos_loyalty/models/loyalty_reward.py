# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models

class LoyaltyReward(models.Model):
    _inherit = 'loyalty.reward'

    reward_product_ids = fields.Many2many(
        'product.product', "Reward Products", compute='_compute_is_multi_product',
        help="These are the products that can be claimed with this rule.")

    # NOTE: override of multi product as they call the same expensive function
    def _compute_is_multi_product(self):
        for reward in self:
            reward_products = reward._get_reward_products()
            reward.multi_product = reward.reward_type == 'product' and len(reward_products) > 1
            reward.reward_product_ids = reward.reward_type == 'product' and reward_products or self.env['product.product']
