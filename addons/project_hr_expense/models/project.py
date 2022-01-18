# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _
from odoo.osv import expression

class Project(models.Model):
    _inherit = 'project.project'

    expenses_count = fields.Integer('# Expenses', compute='_compute_expenses_count', groups='hr_expense.group_hr_expense_team_approver')

    @api.depends('analytic_account_id')
    def _compute_expenses_count(self):
        expenses_data = self.env['hr.expense'].read_group([
            ('analytic_account_id', '!=', False),
            ('analytic_account_id', 'in', self.analytic_account_id.ids)
        ],
        ['analytic_account_id'], ['analytic_account_id'])
        mapped_data = {data['analytic_account_id'][0]: data['analytic_account_id_count'] for data in expenses_data}
        for project in self:
            project.expenses_count = mapped_data.get(project.analytic_account_id.id, 0)

    # ----------------------------
    #  Actions
    # ----------------------------

    def action_open_project_expenses(self):
        expenses = self.env['hr.expense'].search([
            ('analytic_account_id', '!=', False),
            ('analytic_account_id', 'in', self.analytic_account_id.ids)
        ])
        action = self.env["ir.actions.actions"]._for_xml_id("hr_expense.hr_expense_actions_all")
        action.update({
            'display_name': _('Expenses'),
            'views': [[False, 'tree'], [False, 'form'], [False, 'kanban'], [False, 'graph'], [False, 'pivot']],
            'context': {'default_analytic_account_id': self.analytic_account_id.id},
            'domain': [('id', 'in', expenses.ids)]
        })
        if(len(expenses) == 1):
            action["views"] = [[False, 'form']]
            action["res_id"] = expenses.id
        return action

    # ----------------------------
    #  Project Update
    # ----------------------------
    def _get_expenses_profitability_items(self):
        if not self.analytic_account_id:
            return {}
        can_see_expense = self.user_has_groups('hr_expense.group_hr_expense_team_approver')
        expenses_read_group = self.env['hr.expense'].read_group(
            [('analytic_account_id', 'in', self.analytic_account_id.ids),
             ('is_refused', '=', False),
             ('state', 'in', ['approved', 'done'])],
            ['unit_amount', 'quantity', 'expense_sheet', 'ids:array_agg(id)'],
            ['expense_sheet'],
        )
        expense_ids = []
        if can_see_expense:
            expense_data_per_sheet = {}
            for expense_data in expenses_read_group:
                expense_ids += expense_data['ids']
                expense_data_per_sheet[expense_data['expense_sheet'][0]] = expense_data['quantity'] * expense_data['unit_amount']
        else:
            expense_data_per_sheet = {res['expense_sheet'][0]: res['quantity'] * res['unit_amount'] for res in expenses_read_group}
        amount_billed = sum(expense_data_per_sheet.values())
        return {
            'revenues': {},
            'costs': {'id': 'expenses', 'name': _('Expenses'), 'billed': -amount_billed, 'to_bill': 0.0, 'record_ids': expense_ids},
        }

    def _get_profitability_aal_domain(self):
        return expression.AND([
            super()._get_profitability_aal_domain(),
            ['|', ('move_id', '=', False), ('move_id.expense_id', '=', False)],
        ])

    def _get_profitability_items(self):
        profitability_data = super()._get_profitability_items()
        expenses_data = self._get_expenses_profitability_items()
        if expenses_data:
            if expenses_data['revenues']:
                revenues = profitability_data['revenues']
                revenues['data'].append(expenses_data['revenues'])
                revenues['total'] = {k: revenues['total'][k] + expenses_data['revenues'][k] for k in ['invoiced', 'to_invoice']}
            costs = profitability_data['costs']
            costs['data'].append(expenses_data['costs'])
            costs['total'] = {k: costs['total'][k] + expenses_data['costs'][k] for k in ['billed', 'to_bill']}
        return profitability_data
