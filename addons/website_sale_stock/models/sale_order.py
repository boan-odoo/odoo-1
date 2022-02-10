# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, fields, models


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    warning_stock = fields.Char('Warning')

    def _cart_update(self, product_id=None, line_id=None, add_qty=0, set_qty=0, **kwargs):
        values = super()._cart_update(product_id, line_id, add_qty, set_qty, **kwargs)
        line_id = values.get('line_id')

        for line in self.order_line:
            if line.id == line_id \
               and line.product_id.type == 'product' \
               and not line.product_id.allow_out_of_stock_order:
                cart_qty, free_qty = self._get_cart_and_free_qty(line=line)
                if cart_qty > free_qty:
                    new_val = super()._cart_update(
                        line.product_id.id, line.id, free_qty - cart_qty, 0, **kwargs
                    )
                    values.update(new_val)

                    # Make sure line still exists, it may have been deleted in super()_cartupdate
                    # because qty can be <= 0
                    if line.exists() and new_val['quantity']:
                        # FIXME TLE: I do think the second condition should not be checked.
                        values['warning'] = line._set_warning_stock(cart_qty, new_val['quantity'])
                    else:
                        self.warning_stock = _("""
                            Some products became unavailable and your cart has been updated. We're
                            sorry for the inconvenience.
                        """)
                        values['warning'] = self.warning_stock
        return values

    def _get_stock_warning(self, clear=True):
        self.ensure_one()
        warn = self.warning_stock
        if clear:
            self.warning_stock = ''
        return warn

    def _get_cart_and_free_qty(self, line=None, product=None, **kwargs):
        """ Get cart quantity and free quantity for given product or line's product.

        Note: self.ensure_one()

        :param SaleOrderLine line: The optional line
        :param ProductProduct product: The optional product
        """
        self.ensure_one()
        if not line and not product:
            return 0, 0
        cart_qty = sum(
            self._get_common_product_lines(line, product, **kwargs).mapped('product_uom_qty')
        )
        free_qty = line.product_id.with_context(warehouse=self.warehouse_id.id).free_qty
        return cart_qty, free_qty

    def _get_common_product_lines(self, line=None, product=None, **kwargs):
        """ Get the lines with the same product or line's product

        :param SaleOrderLine line: The optional line
        :param ProductProduct product: The optional product
        """
        if not line and not product:
            return self.env['sale.order.line']
        product = product or line.product_id
        return self.order_line.filtered(lambda l: l.product_id == product)
