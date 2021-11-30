# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, models
from odoo.exceptions import ValidationError

class ProductProduct(models.Model):
    _inherit = 'product.product'

    @api.ondelete(at_uninstall=False)
    def _unlink_reward_product(self):
        if self.env['loyalty.reward'].sudo().search_count([('discount_line_product_id', 'in', self.ids)]):
            raise ValidationError(_("Deleting a discount line product is not allowed."))
