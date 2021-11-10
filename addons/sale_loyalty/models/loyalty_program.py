# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models
from babel.dates import format_datetime

#TODO: Most of this file's functions are unused
class LoyaltyProgram(models.Model):
    _inherit = 'loyalty.program'

    order_count = fields.Integer(compute='_compute_order_count')

    # The api.depends is handled in `def modified` of `sale_coupon/models/sale_order.py`
    def _compute_order_count(self):
        #TODO: optimize using read_group
        for program in self:
            program.order_count = self.env['sale.order.line'].search_count([('product_id', 'in', program.reward_ids.discount_line_product_id.id)])

    # The api.depends is handled in `def modified` of `sale_coupon/models/sale_order.py`
    def _compute_total_order_count(self):
        super()._compute_total_order_count()
        for program in self:
            program.total_order_count += program.order_count
