# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, _
from odoo.osv import expression


class Project(models.Model):
    _inherit = "project.project"

    production_count = fields.Integer(related="analytic_account_id.production_count", groups='mrp.group_mrp_user')
    workorder_count = fields.Integer(related="analytic_account_id.workorder_count", groups='mrp.group_mrp_user')
    bom_count = fields.Integer(related="analytic_account_id.bom_count", groups='mrp.group_mrp_user')

    def action_view_mrp_production(self):
        self.ensure_one()
        action = self.analytic_account_id.action_view_mrp_production()
        if self.production_count > 1:
            action["view_mode"] = 'tree,form,kanban,calendar,pivot,graph'
        return action

    def action_view_mrp_bom(self):
        self.ensure_one()
        action = self.analytic_account_id.action_view_mrp_bom()
        if self.bom_count > 1:
            action['view_mode'] = 'tree,form,kanban'
        return action

    def action_view_workorder(self):
        self.ensure_one()
        action = self.analytic_account_id.action_view_workorder()
        if self.workorder_count > 1:
            action['view_mode'] = 'tree,form,kanban,calendar,pivot,graph'
        return action

    # ----------------------------
    #  Project Updates
    # ----------------------------

    def _get_profitability_aal_domain(self):
        return expression.AND([
            super()._get_profitability_aal_domain(),
            [('category', '!=', 'manufacturing_order')],
        ])

    def _get_profitability_items(self, with_action=True):
        profitability_items = super()._get_profitability_items(with_action)
        mrp_category = 'manufacturing_order'
        mrp_aal_read_group = self.env['account.analytic.line'].sudo().read_group([('account_id', 'in', self.analytic_account_id.ids), ('category', '=', mrp_category)], ['amount'], ['account_id'])
        can_see_manufactoring_order = with_action and len(self) == 1 and self.user_has_groups('mrp.group_mrp_user')
        mrp_costs = {
            'id': mrp_category,
            'name': _('Manufacturing Orders'),
            'billed': sum([res['amount'] for res in mrp_aal_read_group]),
            'to_bill': 0.0,
        }
        if can_see_manufactoring_order:
            mrp_costs['action'] = self.action_view_mrp_production()
        costs = profitability_items['costs']
        costs['data'].append(mrp_costs)
        costs['total']['billed'] += mrp_costs['billed']
        return profitability_items

    def _get_stat_buttons(self):
        buttons = super(Project, self)._get_stat_buttons()
        if self.user_has_groups('mrp.group_mrp_user'):
            buttons.extend([{
                'icon': 'flask',
                'text': _('Bills of Materials'),
                'number': self.bom_count,
                'action_type': 'object',
                'action': 'action_view_mrp_bom',
                'show': self.bom_count > 0,
                'sequence': 45,
            }])
        return buttons
