# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'Sale Loyalty',
    'summary': 'Use discounts and loyalty programs in sales orders',
    'description': 'Integrate discount and loyalty programs mechanisms in sales orders.',
    'category': 'Sales/Sales',
    'version': '1.0',
    'depends': ['sale', 'loyalty'],
    'data': [
        'security/ir.model.access.csv',
        'views/coupon_program_views.xml',
        'wizard/sale_loyalty_apply_wizard_views.xml',
        'views/sale_order_views.xml',
    ],
    'license': 'LGPL-3',
}
