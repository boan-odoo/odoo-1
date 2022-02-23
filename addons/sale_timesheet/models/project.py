# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import json

from collections import defaultdict

from odoo import api, fields, models, _
from odoo.osv import expression
from odoo.exceptions import ValidationError, UserError

from odoo.addons.sale_timesheet.models.product import GENERAL_TO_SERVICE

# YTI PLEASE SPLIT ME
class Project(models.Model):
    _inherit = 'project.project'

    @api.model
    def default_get(self, fields):
        """ Pre-fill timesheet product as "Time" data product when creating new project allowing billable tasks by default. """
        result = super(Project, self).default_get(fields)
        if 'timesheet_product_id' in fields and result.get('allow_billable') and result.get('allow_timesheets') and not result.get('timesheet_product_id'):
            default_product = self.env.ref('sale_timesheet.time_product', False)
            if default_product:
                result['timesheet_product_id'] = default_product.id
        return result

    def _default_timesheet_product_id(self):
        return self.env.ref('sale_timesheet.time_product', False)

    pricing_type = fields.Selection([
        ('task_rate', 'Task rate'),
        ('fixed_rate', 'Project rate'),
        ('employee_rate', 'Employee rate')
    ], string="Pricing", default="task_rate",
        compute='_compute_pricing_type',
        search='_search_pricing_type',
        help='The task rate is perfect if you would like to bill different services to different customers at different rates. The fixed rate is perfect if you bill a service at a fixed rate per hour or day worked regardless of the employee who performed it. The employee rate is preferable if your employees deliver the same service at a different rate. For instance, junior and senior consultants would deliver the same service (= consultancy), but at a different rate because of their level of seniority.')
    sale_line_employee_ids = fields.One2many('project.sale.line.employee.map', 'project_id', "Sale line/Employee map", copy=False,
        help="Employee/Sale Order Item Mapping:\n Defines to which sales order item an employee's timesheet entry will be linked."
        "By extension, it defines the rate at which an employee's time on the project is billed.")
    allow_billable = fields.Boolean("Billable", help="Invoice your time and material from tasks.")
    billable_percentage = fields.Integer(
        compute='_compute_billable_percentage',
        help="% of timesheets that are billable compared to the total number of timesheets linked to the AA of the project, rounded to the unit.")
    display_create_order = fields.Boolean(compute='_compute_display_create_order')
    timesheet_product_id = fields.Many2one(
        'product.product', string='Timesheet Product',
        domain="""[
            ('detailed_type', '=', 'service'),
            ('invoice_policy', '=', 'delivery'),
            ('service_type', '=', 'timesheet'),
            '|', ('company_id', '=', False), ('company_id', '=', company_id)]""",
        help='Select a Service product with which you would like to bill your time spent on tasks.',
        compute="_compute_timesheet_product_id", store=True, readonly=False,
        default=_default_timesheet_product_id)
    warning_employee_rate = fields.Boolean(compute='_compute_warning_employee_rate')
    partner_id = fields.Many2one(
        compute='_compute_partner_id', store=True, readonly=False)

    @api.depends('sale_line_id', 'sale_line_employee_ids', 'allow_billable')
    def _compute_pricing_type(self):
        billable_projects = self.filtered('allow_billable')
        for project in billable_projects:
            if project.sale_line_employee_ids:
                project.pricing_type = 'employee_rate'
            elif project.sale_line_id:
                project.pricing_type = 'fixed_rate'
            else:
                project.pricing_type = 'task_rate'
        (self - billable_projects).update({'pricing_type': False})

    def _search_pricing_type(self, operator, value):
        """ Search method for pricing_type field.

            This method returns a domain based on the operator and the value given in parameter:
            - operator = '=':
                - value = 'task_rate': [('sale_line_employee_ids', '=', False), ('sale_line_id', '=', False), ('allow_billable', '=', True)]
                - value = 'fixed_rate': [('sale_line_employee_ids', '=', False), ('sale_line_id', '!=', False), ('allow_billable', '=', True)]
                - value = 'employee_rate': [('sale_line_employee_ids', '!=', False), ('allow_billable', '=', True)]
                - value is False: [('allow_billable', '=', False)]
            - operator = '!=':
                - value = 'task_rate': ['|', '|', ('sale_line_employee_ids', '!=', False), ('sale_line_id', '!=', False), ('allow_billable', '=', False)]
                - value = 'fixed_rate': ['|', '|', ('sale_line_employee_ids', '!=', False), ('sale_line_id', '=', False), ('allow_billable', '=', False)]
                - value = 'employee_rate': ['|', ('sale_line_employee_ids', '=', False), ('allow_billable', '=', False)]
                - value is False: [('allow_billable', '!=', False)]

            :param operator: the supported operator is either '=' or '!='.
            :param value: the value than the field should be is among these values into the following tuple: (False, 'task_rate', 'fixed_rate', 'employee_rate').

            :returns: the domain to find the expected projects.
        """
        if operator not in ('=', '!='):
            raise UserError(_('Operation not supported'))
        if not ((isinstance(value, bool) and value is False) or (isinstance(value, str) and value in ('task_rate', 'fixed_rate', 'employee_rate'))):
            raise UserError(_('Value does not exist in the pricing type'))
        if value is False:
            return [('allow_billable', operator, value)]

        sol_cond = ('sale_line_id', '!=', False)
        mapping_cond = ('sale_line_employee_ids', '!=', False)
        if value == 'task_rate':
            domain = [expression.NOT_OPERATOR, sol_cond, expression.NOT_OPERATOR, mapping_cond]
        elif value == 'fixed_rate':
            domain = [sol_cond, expression.NOT_OPERATOR, mapping_cond]
        else:  # value == 'employee_rate'
            domain = [mapping_cond]

        domain = expression.AND([domain, [('allow_billable', '=', True)]])
        domain = expression.normalize_domain(domain)
        if operator != '=':
            domain.insert(0, expression.NOT_OPERATOR)
        domain = expression.distribute_not(domain)
        return domain

    @api.depends('analytic_account_id', 'timesheet_ids')
    def _compute_billable_percentage(self):
        timesheets_read_group = self.env['account.analytic.line'].read_group([('project_id', 'in', self.ids)], ['project_id', 'so_line', 'unit_amount'], ['project_id', 'so_line'], lazy=False)
        timesheets_by_project = defaultdict(list)
        for res in timesheets_read_group:
            timesheets_by_project[res['project_id'][0]].append((res['unit_amount'], bool(res['so_line'])))
        for project in self:
            timesheet_total = timesheet_billable = 0.0
            for unit_amount, is_billable_timesheet in timesheets_by_project[project.id]:
                timesheet_total += unit_amount
                if is_billable_timesheet:
                    timesheet_billable += unit_amount
            billable_percentage = timesheet_billable / timesheet_total * 100 if timesheet_total > 0 else 0
            project.billable_percentage = round(billable_percentage)

    @api.depends('partner_id', 'pricing_type')
    def _compute_display_create_order(self):
        for project in self:
            project.display_create_order = project.partner_id and project.pricing_type == 'task_rate'

    @api.depends('allow_timesheets', 'allow_billable')
    def _compute_timesheet_product_id(self):
        default_product = self.env.ref('sale_timesheet.time_product', False)
        for project in self:
            if not project.allow_timesheets or not project.allow_billable:
                project.timesheet_product_id = False
            elif not project.timesheet_product_id:
                project.timesheet_product_id = default_product

    @api.depends('pricing_type', 'allow_timesheets', 'allow_billable', 'sale_line_employee_ids', 'sale_line_employee_ids.employee_id')
    def _compute_warning_employee_rate(self):
        projects = self.filtered(lambda p: p.allow_billable and p.allow_timesheets and p.pricing_type == 'employee_rate')
        employees = self.env['account.analytic.line'].read_group([('task_id', 'in', projects.task_ids.ids)], ['employee_id', 'project_id'], ['employee_id', 'project_id'], ['employee_id', 'project_id'], lazy=False)
        dict_project_employee = defaultdict(list)
        for line in employees:
            dict_project_employee[line['project_id'][0]] += [line['employee_id'][0]] if line['employee_id'] else []
        for project in projects:
            project.warning_employee_rate = any(x not in project.sale_line_employee_ids.employee_id.ids for x in dict_project_employee[project.id])

        (self - projects).warning_employee_rate = False

    @api.depends('sale_line_employee_ids.sale_line_id', 'sale_line_id')
    def _compute_partner_id(self):
        for project in self:
            if project.partner_id:
                continue
            if project.allow_billable and project.allow_timesheets and project.pricing_type != 'task_rate':
                sol = project.sale_line_id or project.sale_line_employee_ids.sale_line_id[:1]
                project.partner_id = sol.order_partner_id

    @api.depends('partner_id')
    def _compute_sale_line_id(self):
        super()._compute_sale_line_id()
        for project in self.filtered(lambda p: not p.sale_line_id and p.partner_id and p.pricing_type == 'employee_rate'):
            # Give a SOL by default either the last SOL with service product and remaining_hours > 0
            sol = self.env['sale.order.line'].search([
                ('is_service', '=', True),
                ('order_partner_id', 'child_of', project.partner_id.commercial_partner_id.id),
                ('is_expense', '=', False),
                ('state', 'in', ['sale', 'done']),
                ('remaining_hours', '>', 0)
            ], limit=1)
            project.sale_line_id = sol or project.sale_line_employee_ids.sale_line_id[:1]  # get the first SOL containing in the employee mappings if no sol found in the search

    @api.depends('sale_line_employee_ids.sale_line_id', 'allow_billable')
    def _compute_sale_order_count(self):
        billable_projects = self.filtered('allow_billable')
        super(Project, billable_projects)._compute_sale_order_count()
        (self - billable_projects).sale_order_count = 0

    @api.constrains('sale_line_id')
    def _check_sale_line_type(self):
        for project in self.filtered(lambda project: project.sale_line_id):
            if not project.sale_line_id.is_service:
                raise ValidationError(_("You cannot link a billable project to a sales order item that is not a service."))
            if project.sale_line_id.is_expense:
                raise ValidationError(_("You cannot link a billable project to a sales order item that comes from an expense or a vendor bill."))

    def write(self, values):
        res = super(Project, self).write(values)
        if 'allow_billable' in values and not values.get('allow_billable'):
            self.task_ids._get_timesheet().write({
                'so_line': False,
            })
        return res

    def _update_timesheets_sale_line_id(self):
        for project in self.filtered(lambda p: p.allow_billable and p.allow_timesheets):
            timesheet_ids = project.sudo(False).mapped('timesheet_ids').filtered(lambda t: not t.is_so_line_edited and t._is_not_billed())
            if not timesheet_ids:
                continue
            for employee_id in project.sale_line_employee_ids.filtered(lambda l: l.project_id == project).employee_id:
                sale_line_id = project.sale_line_employee_ids.filtered(lambda l: l.project_id == project and l.employee_id == employee_id).sale_line_id
                timesheet_ids.filtered(lambda t: t.employee_id == employee_id).sudo().so_line = sale_line_id

    def action_open_project_invoices(self):
        invoices = self.env['account.move'].search([
            ('line_ids.analytic_account_id', '!=', False),
            ('line_ids.analytic_account_id', 'in', self.analytic_account_id.ids),
            ('move_type', '=', 'out_invoice')
        ])
        action = {
            'name': _('Invoices'),
            'type': 'ir.actions.act_window',
            'res_model': 'account.move',
            'views': [[False, 'tree'], [False, 'form'], [False, 'kanban']],
            'domain': [('id', 'in', invoices.ids)],
            'context': {
                'create': False,
            }
        }
        if len(invoices) == 1:
            action['views'] = [[False, 'form']]
            action['res_id'] = invoices.id
        return action

    def action_view_timesheet(self):
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': _('Timesheets of %s', self.name),
            'domain': [('project_id', '!=', False)],
            'res_model': 'account.analytic.line',
            'view_id': False,
            'view_mode': 'tree,form',
            'help': _("""
                <p class="o_view_nocontent_smiling_face">
                    Record timesheets
                </p><p>
                    You can register and track your workings hours by project every
                    day. Every time spent on a project will become a cost and can be re-invoiced to
                    customers if required.
                </p>
            """),
            'limit': 80,
            'context': {
                'default_project_id': self.id,
                'search_default_project_id': [self.id]
            }
        }

    def action_make_billable(self):
        return {
            "name": _("Create Sales Order"),
            "type": 'ir.actions.act_window',
            "res_model": 'project.create.sale.order',
            "views": [[False, "form"]],
            "target": 'new',
            "context": {
                'active_id': self.id,
                'active_model': 'project.project',
                'default_product_id': self.timesheet_product_id.id,
            },
        }

    def action_billable_time_button(self):
        self.ensure_one()
        action = self.env["ir.actions.actions"]._for_xml_id("hr_timesheet.timesheet_action_all")
        action.update({
            'context': {
                'grid_range': 'week',
                'search_default_groupby_timesheet_invoice_type': True,
                'pivot_row_groupby': ['date:month'],
                'default_project_id': self.id,
            },
            'domain': [('project_id', '=', self.id)],
            'view_mode': 'tree,kanban,pivot,graph,form',
            'views': [
                [self.env.ref('hr_timesheet.timesheet_view_tree_user').id, 'tree'],
                [self.env.ref('hr_timesheet.view_kanban_account_analytic_line').id, 'kanban'],
                [self.env.ref('sale_timesheet.view_hr_timesheet_line_pivot_billing_rate').id, 'pivot'],
                [self.env.ref('hr_timesheet.view_hr_timesheet_line_graph_all').id, 'graph'],
                [self.env.ref('hr_timesheet.timesheet_view_form_user').id, 'form'],
            ],
        })
        return action

    # ----------------------------
    #  Project Updates
    # ----------------------------

    def get_panel_data(self):
        panel_data = super(Project, self).get_panel_data()
        return {
            **panel_data,
            'analytic_account_id': self.analytic_account_id.id,
        }

    def _get_all_sale_order_items_query(self):
        billable_project = self.filtered('allow_billable')
        query = super(Project, billable_project)._get_all_sale_order_items_query()
        Timesheet = self.env['account.analytic.line']
        timesheet_query_str, timesheet_params = Timesheet\
            ._where_calc([('project_id', 'in', billable_project.ids), ('so_line', '!=', False)])\
            .select(f'{Timesheet._table}.project_id AS id', f'{Timesheet._table}.so_line')

        EmployeeMapping = self.env['project.sale.line.employee.map']
        employee_mapping_query_str, employee_mapping_params = EmployeeMapping \
            ._where_calc([('project_id', 'in', billable_project.ids), ('sale_line_id', '!=', False)]) \
            .select(f'{EmployeeMapping._table}.project_id AS id', f'{EmployeeMapping._table}.sale_line_id')

        query._tables['project_sale_order_item'] = ' UNION '.join([
            query._tables['project_sale_order_item'],
            timesheet_query_str,
            employee_mapping_query_str])
        query._where_params += timesheet_params + employee_mapping_params
        return query

    def _get_service_sale_order_lines(self):
        # used in project update model
        # FIXME: Perhaps doing a SQL search to get the sale_order_ids in one query.
        if not self:
            return self.env['sale.order.line']
        domain = self._get_sale_items_domain([('is_service', '=', True), ('is_downpayment', '=', False)])
        return self.env['sale.order.line'].search(domain)

    def _get_profitability_aal_domain(self):
        domain = [('so_line', 'in', self._get_all_sale_order_items().ids)]
        if not self.allow_billable:  # Then useless to compute the revenues since the project should gains no money since it is not billable
            domain = expression.AND([domain, [('amount', '<', 0)]])
        return expression.OR([
            super()._get_profitability_aal_domain(),
            domain,
        ])

    def _get_profitability_items_from_aal(self):
        aa_line_read_group = self.env['account.analytic.line'].read_group(
            self._get_profitability_aal_domain(),
            ['timesheet_invoice_type', 'timesheet_invoice_id', 'so_line', 'product_id', 'unit_amount', 'amount', 'ids:array_agg(id)'],
            ['timesheet_invoice_type', 'timesheet_invoice_id', 'so_line', 'product_id'],
            lazy=False)
        can_see_timesheets = self.user_has_groups('hr_timesheet.group_hr_timesheet_approver')
        revenues_dict = defaultdict(lambda: {'invoiced': 0.0, 'to_invoice': 0.0, 'record_ids': []})
        costs_dict = defaultdict(lambda: {'billed': 0.0, 'to_bill': 0.0, 'record_ids': []})
        total_revenues = {'invoiced': 0.0, 'to_invoice': 0.0}
        total_costs = {'billed': 0.0, 'to_bill': 0.0}
        aal_per_invoice = defaultdict(list)
        aal_per_sol = defaultdict(list)
        for res in aa_line_read_group:
            amount = res['amount']
            invoice_type = res['timesheet_invoice_type']
            if amount < 0:  # cost
                cost = costs_dict[invoice_type]
                if can_see_timesheets and invoice_type != 'other_costs':
                    cost['record_ids'] += res['ids']
                cost['billed'] += amount
                total_costs['billed'] += amount
            else:  # revenues
                revenues = revenues_dict[invoice_type]
                if can_see_timesheets and invoice_type != 'other_revenues':
                    revenues['record_ids'] += res['ids']
                revenues['invoiced'] += amount
                total_revenues['invoiced'] += amount
            invoice_id = res['timesheet_invoice_id'] and res['timesheet_invoice_id'][0]
            aal_per_invoice[invoice_id] += res['ids']
            sol_id = res['so_line'] and res['so_line'][0]
            aal_per_sol[sol_id] += res['ids']
        sol_read = self.env['sale.order.line'].search_read(
            [('id', 'in', list(aal_per_sol.keys())), ('product_id', '!=', False), ('is_expense', '=', False)],
            ['product_id', 'untaxed_amount_to_invoice', 'untaxed_amount_invoiced', 'is_downpayment'],
        )
        sols_per_product = {
            res['product_id'][0]: {
                res['id']: (res['untaxed_amount_to_invoice'], res['untaxed_amount_invoiced'], res['is_downpayment'])
            } for res in sol_read
        }
        product_read_group = self.env['product.product'].read_group(
            [('id', 'in', list(sols_per_product)), ('expense_policy', '=', 'no')],
            ['invoice_policy', 'service_type', 'type', 'ids:array_agg(id)'],
            ['invoice_policy', 'service_type', 'type'],
            lazy=False)
        sols_service_policy = defaultdict(dict)
        service_policy_to_invoice_type = {
            'ordered_timesheet': 'billable_fixed',
            'delivered_timesheet': 'billable_time',
            'delivered_manual': 'service_revenues',
        }
        for res in product_read_group:
            product_ids = res['ids']
            service_policy = GENERAL_TO_SERVICE.get(
                (res['invoice_policy'], res['service_type']),
                res['type'] == 'service' and 'ordered_timesheet')
            for product_id, sol_dict in sols_per_product.items():
                if product_id in product_ids:
                    sols_service_policy[service_policy].update(sol_dict)  # just for testing purpose
                    invoice_type = service_policy_to_invoice_type.get(service_policy, 'other_revenues')
                    revenue = revenues_dict[invoice_type]
                    for sol_id, (untaxed_amount_to_invoice, untaxed_amount_invoiced, is_downpayment) in sol_dict.items():
                        assert not is_downpayment, f"Normally no downpayment should be taken into account, see the problematic SOL ID: {sol_id}"  # FIXME: testing purpose
                        revenue['to_invoice'] += untaxed_amount_to_invoice
                        total_revenues['to_invoice'] += untaxed_amount_to_invoice
                        revenue['invoiced'] += untaxed_amount_invoiced
                        total_revenues['invoiced'] += untaxed_amount_invoiced
                        if invoice_type == 'other_revenues':
                            revenue['record_ids'].append(sol_id)
        invoice_type_to_label = {
            'billable_fixed': _('Timesheets (Fixed Price)'),
            'billable_time': _('Timesheets (Billed on Timesheets)'),
            'service_revenues': _('Timesheets (Billed on Milestones)'),
            'non_billable': _('Timesheets (Non Billable)'),
            'other_revenues': _('Material'),
        }

        basic_action_timesheets = None
        if can_see_timesheets and len(self) == 1:
            basic_action_timesheets = self.action_billable_time_button()

        def convert_dict_into_profitability_data(d):
            profitability_data = []
            for invoice_type, vals in d.items():
                record_ids = vals.pop('record_ids', [])
                data = {'id': invoice_type, 'name': invoice_type_to_label.get(invoice_type, invoice_type), **vals}
                if record_ids:
                    if invoice_type in ['other_costs', 'other_revenues']:
                        # action to see the SOL
                        pass
                    elif basic_action_timesheets:  # action to see the timesheets
                        action_timesheets = {**basic_action_timesheets, 'domain': [('id', 'in', record_ids), ('project_id', 'in', self.ids)]}
                        if len(record_ids) == 1:  # set the form view only
                            if 'views' in action_timesheets:
                                action_timesheets['views'] = [
                                    (view_id, view_type)
                                    for view_id, view_type in action_timesheets['views']
                                    if view_type == 'form'
                                ] or [False, 'form']
                            action_timesheets['view_mode'] = 'form'
                            action_timesheets['res_id'] = record_ids[0]
                        data['action'] = json.dumps(action_timesheets)
                profitability_data.append(data)
            return profitability_data

        return {
            'revenues': {'data': convert_dict_into_profitability_data(revenues_dict), 'total': total_revenues},
            'costs': {'data': convert_dict_into_profitability_data(costs_dict), 'total': total_costs},
        }

    def _get_profitability_items(self):
        profitability_items = super()._get_profitability_items()
        aal_profitability_items = self._get_profitability_items_from_aal()

        def merge_profitability_data(a, b):
            assert all(k in a and k in b for k in ['data', 'total']), 'the both dictionary given in parameter should have "data" and "total" as key'
            return {
                'data': a['data'] + b['data'],
                'total': {key: a['total'][key] + b['total'][key] for key in a['total'].keys() if key in b['total']}
            }

        profitability_items['revenues'] = merge_profitability_data(profitability_items['revenues'], aal_profitability_items['revenues'])
        profitability_items['costs'] = merge_profitability_data(profitability_items['costs'], aal_profitability_items['costs'])
        return profitability_items

    def _get_profitability_common(self):
        # FIXME: used in project update model
        self.ensure_one()
        result = {
            'costs': 0.0,
            'margin': 0.0,
            'revenues': 0.0
        }

        profitability = self.env['project.profitability.report'].read_group(
            [('project_id', '=', self.id)],
            ['project_id',
                'amount_untaxed_to_invoice',
                'amount_untaxed_invoiced',
                'expense_amount_untaxed_to_invoice',
                'expense_amount_untaxed_invoiced',
                'other_revenues',
                'expense_cost',
                'timesheet_cost',
                'margin'],
            ['project_id'], limit=1)
        if profitability:
            profitability = profitability[0]
            result.update({
                'costs': profitability['timesheet_cost'] + profitability['expense_cost'],
                'margin': profitability['margin'],
                'revenues': (profitability['amount_untaxed_invoiced'] + profitability['amount_untaxed_to_invoice'] +
                                profitability['expense_amount_untaxed_invoiced'] + profitability['expense_amount_untaxed_to_invoice'] +
                                profitability['other_revenues']),
            })
        return result


class ProjectTask(models.Model):
    _inherit = "project.task"

    def _get_default_partner_id(self, project, parent):
        res = super()._get_default_partner_id(project, parent)
        if not res and project:
            # project in sudo if the current user is a portal user.
            related_project = project if not self.user_has_groups('!base.group_user,base.group_portal') else project.sudo()
            if related_project.pricing_type == 'employee_rate':
                return related_project.sale_line_employee_ids.sale_line_id.order_partner_id[:1]
        return res

    sale_order_id = fields.Many2one(domain="['|', '|', ('partner_id', '=', partner_id), ('partner_id', 'child_of', commercial_partner_id), ('partner_id', 'parent_of', partner_id)]")
    so_analytic_account_id = fields.Many2one(related='sale_order_id.analytic_account_id', string='Sale Order Analytic Account')
    pricing_type = fields.Selection(related="project_id.pricing_type")
    is_project_map_empty = fields.Boolean("Is Project map empty", compute='_compute_is_project_map_empty')
    has_multi_sol = fields.Boolean(compute='_compute_has_multi_sol', compute_sudo=True)
    allow_billable = fields.Boolean(related="project_id.allow_billable")
    timesheet_product_id = fields.Many2one(related="project_id.timesheet_product_id")
    remaining_hours_so = fields.Float('Remaining Hours on SO', compute='_compute_remaining_hours_so', search='_search_remaining_hours_so', compute_sudo=True)
    remaining_hours_available = fields.Boolean(related="sale_line_id.remaining_hours_available")

    @property
    def SELF_READABLE_FIELDS(self):
        return super().SELF_READABLE_FIELDS | {
            'allow_billable',
            'remaining_hours_available',
            'remaining_hours_so',
        }

    @api.depends('sale_line_id', 'timesheet_ids', 'timesheet_ids.unit_amount')
    def _compute_remaining_hours_so(self):
        # TODO This is not yet perfectly working as timesheet.so_line stick to its old value although changed
        #      in the task From View.
        timesheets = self.timesheet_ids.filtered(lambda t: t.task_id.sale_line_id in (t.so_line, t._origin.so_line) and t.so_line.remaining_hours_available)

        mapped_remaining_hours = {task._origin.id: task.sale_line_id and task.sale_line_id.remaining_hours or 0.0 for task in self}
        uom_hour = self.env.ref('uom.product_uom_hour')
        for timesheet in timesheets:
            delta = 0
            if timesheet._origin.so_line == timesheet.task_id.sale_line_id:
                delta += timesheet._origin.unit_amount
            if timesheet.so_line == timesheet.task_id.sale_line_id:
                delta -= timesheet.unit_amount
            if delta:
                mapped_remaining_hours[timesheet.task_id._origin.id] += timesheet.product_uom_id._compute_quantity(delta, uom_hour)

        for task in self:
            task.remaining_hours_so = mapped_remaining_hours[task._origin.id]

    @api.model
    def _search_remaining_hours_so(self, operator, value):
        return [('sale_line_id.remaining_hours', operator, value)]

    @api.depends('so_analytic_account_id.active')
    def _compute_analytic_account_active(self):
        super()._compute_analytic_account_active()
        for task in self:
            task.analytic_account_active = task.analytic_account_active or task.so_analytic_account_id.active

    @api.depends('allow_billable')
    def _compute_sale_order_id(self):
        billable_tasks = self.filtered('allow_billable')
        super(ProjectTask, billable_tasks)._compute_sale_order_id()
        (self - billable_tasks).sale_order_id = False

    @api.depends('commercial_partner_id', 'sale_line_id.order_partner_id', 'parent_id.sale_line_id', 'project_id.sale_line_id', 'allow_billable')
    def _compute_sale_line(self):
        billable_tasks = self.filtered('allow_billable')
        (self - billable_tasks).update({'sale_line_id': False})
        super(ProjectTask, billable_tasks)._compute_sale_line()
        for task in billable_tasks.filtered(lambda t: not t.sale_line_id):
            task.sale_line_id = task._get_last_sol_of_customer()

    @api.depends('project_id.sale_line_employee_ids')
    def _compute_is_project_map_empty(self):
        for task in self:
            task.is_project_map_empty = not bool(task.sudo().project_id.sale_line_employee_ids)

    @api.depends('timesheet_ids')
    def _compute_has_multi_sol(self):
        for task in self:
            task.has_multi_sol = task.timesheet_ids and task.timesheet_ids.so_line != task.sale_line_id

    def _get_last_sol_of_customer(self):
        # Get the last SOL made for the customer in the current task where we need to compute
        self.ensure_one()
        if not self.commercial_partner_id or not self.allow_billable:
            return False
        domain = [('company_id', '=', self.company_id.id), ('is_service', '=', True), ('order_partner_id', 'child_of', self.commercial_partner_id.id), ('is_expense', '=', False), ('state', 'in', ['sale', 'done']), ('remaining_hours', '>', 0)]
        if self.project_id.pricing_type != 'task_rate' and self.project_sale_order_id and self.commercial_partner_id == self.project_id.partner_id.commercial_partner_id:
            domain.append(('order_id', '=?', self.project_sale_order_id.id))
        return self.env['sale.order.line'].search(domain, limit=1)

    def _get_timesheet(self):
        # return not invoiced timesheet and timesheet without so_line or so_line linked to task
        timesheet_ids = super(ProjectTask, self)._get_timesheet()
        return timesheet_ids.filtered(lambda t: t._is_not_billed())

    def _get_action_view_so_ids(self):
        return list(set((self.sale_order_id + self.timesheet_ids.so_line.order_id).ids))

class ProjectTaskRecurrence(models.Model):
    _inherit = 'project.task.recurrence'

    @api.model
    def _get_recurring_fields(self):
        return ['so_analytic_account_id'] + super(ProjectTaskRecurrence, self)._get_recurring_fields()
