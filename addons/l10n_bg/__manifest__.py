# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

# With help from :
# "Bulgarian - Accounting by dXFactory OOD" (LGPL-3)
# "Bulgaria - Accounting by BGO Software, Lumnus LTD, Prodax LTD" (LGPL-3)
{
    'name': 'Bulgaria - Accounting',
    'version': '1.0',
    'category': 'Accounting/Localizations/Account Charts',
    'author': 'Odoo S.A.',
    'description': """ Base module for Bulgarian chart of accounting and localization """,
    'depends': ['account'],
    'data': [
        'data/account_chart_template_data.xml',
        'data/account.account.template.csv',
        'data/l10n_bg_chart_data.xml',
        'data/account_tax_group_data.xml',
        'data/account_tax_template_data.xml',
        'data/account_chart_template_configure_data.xml',
    ],
    'demo': [
        'demo/demo_company.xml',
    ],
    'license': 'LGPL-3',
}