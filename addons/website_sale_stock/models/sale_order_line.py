# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, fields, models


class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    warning_stock = fields.Char('Warning')

    def _get_stock_warning(self, clear=True):
        self.ensure_one()
        warn = self.warning_stock
        if clear:
            self.warning_stock = ''
        return warn

    def _set_warning_stock(self, desired_qty, new_qty):
        self.ensure_one()
        self.warning_stock = _(
            'You ask for %(desired_qty)s products but only %(new_qty)s is available',
            desired_qty=desired_qty, new_qty=new_qty
        )
        return self.warning_stock

    def _get_max_available_qty(self):
        return self.product_id.free_qty - self.product_id.cart_qty
