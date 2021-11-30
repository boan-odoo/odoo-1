# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models

class LoyaltyMail(models.Model):
    _inherit = 'loyalty.mail'

    print_in_pos = fields.Boolean(string='PoS Coupon Print',
        help="""
        If this option is enabled the template will be printed upon validating the order.
        May be useful for digital gift cards.
        """)
