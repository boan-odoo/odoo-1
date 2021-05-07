# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Sales Timesheet Purchase',
    'category': 'Hidden',
    'summary': 'Bridge module between Sales Timesheet and Purchase',
    'description': """
Allows to access purchase orders from Project Overview
======================================================
""",
    'depends': ['sale_timesheet', 'purchase'],
    'data': [
        'report/project_profitability_report_analysis_views.xml',
    ],
    'demo': [],
    'auto_install': True,
}
