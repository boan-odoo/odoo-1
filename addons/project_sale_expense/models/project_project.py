# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, _


class Project(models.Model):
    _inherit = 'project.project'

    def _get_expenses_profitability_items(self):
        if not self.analytic_account_id:
            return {}
        can_see_expense = self.user_has_groups('hr_expense.group_hr_expense_team_approver')
        expenses_read_group = self.env['hr.expense'].read_group(
            [
                ('analytic_account_id', 'in', self.analytic_account_id.ids),
                ('is_refused', '=', False),
                ('state', 'in', ['approved', 'done']),
            ],
            ['sale_order_id', 'product_id', 'ids:array_agg(id)', 'unit_amount', 'quantity'],
            ['sale_order_id', 'product_id'],
            lazy=False,
        )
        expenses_per_so_id = {}
        expense_ids = []
        amount_billed = 0.0
        for res in expenses_read_group:
            price_unit = res['unit_amount']
            quantity = res['quantity']
            amount = price_unit * quantity
            so_id = res['sale_order_id'] and res['sale_order_id'][0]
            product_id = res['product_id'] and res['product_id'][0]
            expenses_per_so_id.setdefault(so_id, {})[product_id] = {'price_unit': price_unit, 'quantity': quantity, 'expense_ids': res['ids']}
            if can_see_expense:
                expense_ids.extend(res['ids'])
            amount_billed += amount
        sol_read_group = self.env['sale.order.line'].read_group(
            [
                ('order_id', 'in', list(expenses_per_so_id.keys())),
                ('product_id.expense_policy', 'in', ['cost', 'sales_price'])
            ],
            ['order_id', 'product_id', 'untaxed_amount_to_invoice', 'untaxed_amount_invoiced', 'qty_to_invoice', 'qty_invoiced'],
            ['order_id', 'product_id'],
            lazy=False)
        total_amount_expense_invoiced = total_amount_expense_to_invoice = 0.0
        reinvoice_expense_ids = []
        for res in sol_read_group:
            expense_data_per_product_id = expenses_per_so_id[res['order_id'][0]]
            product_id = res['product_id'][0]
            if product_id in expense_data_per_product_id:
                expense_data = expense_data_per_product_id[product_id]
                total_amount_expense_to_invoice += res['untaxed_amount_to_invoice']
                total_amount_expense_invoiced += res['untaxed_amount_invoiced']
                if can_see_expense:
                    reinvoice_expense_ids.extend(expense_data['expense_ids'])
        expense_name = _('Expenses')
        return {
            'revenues': {
                'id': 'expenses',
                'name': expense_name,
                'invoiced': total_amount_expense_invoiced,
                'to_invoice': total_amount_expense_to_invoice,
                'record_ids': reinvoice_expense_ids,
            },
            'costs': {
                'id': 'expenses',
                'name': expense_name,
                'billed': -amount_billed,
                'to_bill': 0.0,
                'record_ids': expense_ids,
            },
        }
