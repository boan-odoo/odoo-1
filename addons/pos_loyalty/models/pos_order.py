# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models

class PosOrder(models.Model):
    _inherit = 'pos.order'

    # TODO: redo this route
    def validate_coupon_programs(self, *args):
        """
        This is called after `create_from_ui` is called.

        Here we create any coupon that has to be, coupons for next order for example.
        And return them to be able to use them in the receipt.
        """
        return []
