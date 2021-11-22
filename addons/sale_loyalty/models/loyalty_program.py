# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models
from babel.dates import format_datetime

class LoyaltyProgram(models.Model):
    _inherit = 'loyalty.program'

    order_count = fields.Integer(compute='_compute_order_count')

    # The api.depends is handled in `def modified` of `sale_coupon/models/sale_order.py`
    def _compute_order_count(self):
        # An order should count only once PER program but may appear in multiple programs
        read_group_res = self.env['sale.order.line'].read_group(
            [('reward_id', 'in', self.reward_ids.ids)], ['reward_id:array_agg'], ['order_id'])
        for program in self:
            program_reward_ids = program.reward_ids.ids
            program.order_count = len(1 for group in read_group_res if any(id in group['reward_id'] for id in program_reward_ids))

    # The api.depends is handled in `def modified` of `sale_coupon/models/sale_order.py`
    def _compute_total_order_count(self):
        super()._compute_total_order_count()
        for program in self:
            program.total_order_count += program.order_count
