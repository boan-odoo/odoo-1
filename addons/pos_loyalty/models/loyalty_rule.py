# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models
from odoo.osv import expression

class LoyaltyRule(models.Model):
    _inherit = 'loyalty.rule'

    valid_product_ids = fields.Many2many(
        'product.product', "Valid Products", compute='_compute_valid_product_ids',
        help="These are the products that are valid for this rule.")
    any_product = fields.Boolean(
        compute='_compute_valid_product_ids', help="Technical field, whether all product match")

    @api.depends('product_ids', 'product_category_id') #TODO later: product tags
    def _compute_valid_product_ids(self):
        for rule in self:
            if rule.product_ids or\
                rule.product_category_id or\
                rule.product_domain not in ('[]', "[['sale_ok', '=', True]]"):
                domain = rule._get_valid_product_domain()
                domain = expression.AND([[('available_in_pos', '=', True)], domain])
                rule.valid_product_ids = self.env['product.product'].search(domain)
                rule.any_product = False
            else:
                rule.any_product = True
