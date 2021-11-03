# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models

class LoyaltyReward(models.Model):
    _inherit = 'loyalty.reward'

    # TODO: due to pos, we may need to do loyalty_account just for this function
    def _get_discount_product_values(self):
        res = super()._get_discount_product_values()
        res.update({
            'taxes_id': False,
            'supplier_taxes_id': False,
        })
        return res
