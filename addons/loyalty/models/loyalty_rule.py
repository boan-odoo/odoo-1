# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from collections import defaultdict

import ast

from odoo import _, api, fields, models
from odoo.osv import expression

class LoyaltyRule(models.Model):
    _name = 'loyalty.rule'
    _description = 'Loyalty Rule'

    def _get_reward_point_mode_selection(self):
        return [
            ('order', _('per order')),
            ('money', _('per %s spent', self.env.company.currency_id.symbol)),
            ('unit', _('per unit paid')),
        ]

    program_id = fields.Many2one('loyalty.program', ondelete='cascade')
    # Stored for security rules
    company_id = fields.Many2one(related='program_id.company_id', store=True)
    currency_id = fields.Many2one(related='program_id.currency_id')
    # For kanban view
    currency_symbol = fields.Char(related='currency_id.symbol')

    # Only for dev mode
    product_domain = fields.Char(default="[['sale_ok', '=', True]]")

    product_ids = fields.Many2many('product.product', string='Products')
    product_category_id = fields.Many2one('product.category', string='Categories')
    #TODO later: product tags

    # TODO: > 0 contraint
    reward_point_amount = fields.Float(default=1, string="Reward",
        compute='_compute_from_program_type', readonly=False, store=True,)
    # Only used for program_id.applies_on == 'future'
    reward_point_trigger_multi = fields.Boolean(string='Split per unit', default=False,
        help="Whether to separate reward coupons per matched unit, only applies to 'future' programs and trigger mode per money spent or unit paid..")
    reward_point_name = fields.Char(related='program_id.portal_point_name', readonly=True)
    reward_point_mode = fields.Selection(selection=_get_reward_point_mode_selection, required=True, default='order',
        compute='_compute_from_program_type', readonly=False, store=True)

    minimum_qty = fields.Integer('Minimum Quantity')
    minimum_amount = fields.Monetary('Minimum Purchase', 'currency_id')
    minimum_amount_tax_mode = fields.Selection([
        ('incl', 'Included'),
        ('excl', 'Excluded')], default='incl', required=True,
    )

    @api.depends('program_id.program_type')
    def _compute_from_program_type(self):
        default_values = self.env['loyalty.program']._program_type_default_values()
        grouped_rules = defaultdict(lambda: self.env['loyalty.rule'])
        for rule in self:
            grouped_rules[rule.program_id.program_type] |= rule
        for program_type, rules in grouped_rules.items():
            if program_type in default_values:
                rules.write(default_values[program_type][self._name])

    def _get_valid_product_domain(self):
        self.ensure_one()
        domain = []
        if self.product_ids:
            domain = [('id', 'in', self.product_ids.ids)]
        if self.product_category_id:
            domain = expression.AND([domain, [('categ_id', 'child_of', self.product_category_id.id)]])
        if self.product_domain and self.product_domain != '[]':
            domain = expression.AND([domain, ast.literal_eval(self.product_domain)])
        return domain

    def _get_valid_products(self):
        self.ensure_one()
        return self.env['product.product'].search(self._get_valid_product_domain())

    def _compute_amount(self, currency_to):
        self.ensure_one()
        return self.currency_id._convert(
            self.minimum_amount, currency_to, self.company_id, fields.Date.today())
