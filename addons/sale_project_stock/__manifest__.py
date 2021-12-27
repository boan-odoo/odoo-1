# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Sale Project - Sale Stock',
    'version': '1.0',
    'description': 'Bridge between Sale Project and Sale Stock modules',
    'summary': 'Bridge between Sale Project and Sale Stock modules',
    'license': 'LGPL-3',
    'category': 'Sales',
    'depends': ['sale_project', 'sale_stock'],
    'data': [
        'views/stock_move_views.xml',
    ],
    'demo': [],
    'auto_install': True,
    'application': False,
}
