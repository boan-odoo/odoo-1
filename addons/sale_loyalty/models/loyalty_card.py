# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _


class LoyaltyCard(models.Model):
    _inherit = 'loyalty.card'

    order_id = fields.Many2one('sale.order', 'Order Reference', readonly=True,
        help="The sales order from which coupon is generated")
    sales_order_id = fields.Many2one('sale.order', 'Used in', readonly=True,
        help="The sales order on which the coupon is applied")

    def _check_coupon_code(self, order_date, partner_id, **kwargs):
        message = super()._check_coupon_code(order_date, partner_id, **kwargs)
        order = kwargs.get('order', False)
        if message.get('error', False) or not order:
            return message

        applicable_programs = order._get_applicable_programs()
        if self.program_id in order.applied_coupon_ids.mapped('program_id'):
            message = {'error': _('A Coupon is already applied for the same reward')}
        elif self.program_id not in applicable_programs and self.program_id.promo_applicability in ('both', 'current'):
            message = {'error': _('At least one of the required conditions is not met to get the reward!')}
        return message

    def _get_default_template(self):
        default_template = super()._get_default_template()
        if not default_template:
            return self.env.ref('sale_coupon.mail_template_sale_coupon', False)
        return default_template
