# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'Coupons & Loyalty',
    'summary': "Use discounts, gift card, eWallets and loyalty programs in different sales channels",
    'category': 'Sales',
    'version': '1.0',
    'depends': ['product'],
    'data': [
        'security/ir.model.access.csv',
        'views/loyalty_mail_views.xml',
        'views/loyalty_program_views.xml',
        'views/loyalty_reward_views.xml',
        'views/loyalty_rule_views.xml',
        'wizard/loyalty_generate_wizard_views.xml',
    ],
    'demo': [
    ],
    'installable': True,
    'assets': {
        'web.assets_backend': [
            'loyalty/static/src/scss/loyalty.scss',
        ],
    },
    'license': 'LGPL-3',
}
