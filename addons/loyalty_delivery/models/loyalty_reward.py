# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, fields, models

class LoyaltyReward(models.Model):
    _inherit = 'loyalty.reward'

    reward_type = fields.Selection(
        selection_add=[('shipping', 'Free Shipping')],
        ondelete={'shipping': 'set default'})

    def name_get(self):
        shipping_rewards = self.filtered(lambda r: r.reward_type == 'shipping')
        res = super(LoyaltyReward, self - shipping_rewards).name_get()
        free_shipping_str = _('Free shipping')
        for reward in shipping_rewards:
            res.append((reward.id, free_shipping_str))
        return res
