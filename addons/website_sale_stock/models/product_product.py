# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models
from odoo.addons.website.models import ir_http


class ProductProduct(models.Model):
    _inherit = 'product.product'

    cart_qty = fields.Integer(compute='_compute_cart_qty')

    def _compute_cart_qty(self):
        website = ir_http.get_request_website()
        if not website:
            self.cart_qty = 0
            return
        cart = website.sale_get_order()
        if not cart:
            self.cart_qty = 0
            return
        for product in self:
            product.cart_qty = sum(
                cart._get_common_product_lines(product=product).mapped('product_uom_qty')
            )
