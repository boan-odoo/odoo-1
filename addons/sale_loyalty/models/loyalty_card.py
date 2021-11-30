# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class LoyaltyCard(models.Model):
    _inherit = 'loyalty.card'

    order_id = fields.Many2one('sale.order', 'Order Reference', readonly=True,
        help="The sales order from which coupon is generated")

    def _get_default_template(self):
        default_template = super()._get_default_template()
        if not default_template:
            default_template = self.env.ref('sale_loyalty.mail_template_sale_loyalty', raise_if_not_found=False)
        return default_template

    def _get_mail_partner(self):
        return super()._get_mail_partner() or self.order_id.partner_id.id
