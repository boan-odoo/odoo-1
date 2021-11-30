# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, models
from odoo.fields import Command

class SaleOrder(models.Model):
    _inherit = 'sale.order'

    def _get_no_effect_on_threshold_lines(self):
        self.ensure_one()
        lines = self.order_line.filtered(lambda line:\
            line.is_delivery or\
            line.reward_id.reward_type == 'shipping')
        return lines + super()._get_no_effect_on_threshold_lines()

    def _get_reward_values_free_shipping(self, reward, coupon, **kwargs):
        delivery_line = self.order_line.filtered(lambda l: l.is_delivery)
        if not delivery_line:
            return [] # Shipping cost not in order line
        taxes = delivery_line.product_id.taxes_id.filtered(lambda t: t.company_id.id == self.company_id.id)
        taxes = self.fiscal_position_id.map_tax(taxes)
        max_discount = reward.discount_max_amount or float('inf')
        return [{
            'name': _('Free Shipping - %s', reward.description),
            'reward_id': reward.id,
            'coupon_id': coupon.id,
            'points_cost': reward.required_points if not reward.clear_wallet else self._get_real_points_for_coupon(coupon),
            'product_id': reward.discount_line_product_id.id,
            'price_unit': -min(max_discount, delivery_line.price_unit),
            'product_uom_qty': 1,
            'product_uom': reward.discount_line_product_id.uom_id.id,
            'order_id': self.id,
            'is_reward_line': True,
            'tax_id': [(Command.CLEAR, 0, 0)] + [(Command.LINK, tax.id, False) for tax in taxes],
        }]

    def _get_reward_line_values(self, reward, coupon, **kwargs):
        self.ensure_one()
        if reward.reward_type == 'shipping':
            self = self.with_context(lang=self.partner_id.lang)
            reward = reward.with_context(lang=self.partner_id.lang)
            return self._get_reward_values_free_shipping(reward, coupon, **kwargs)
        return super()._get_reward_line_values(reward, coupon, **kwargs)
