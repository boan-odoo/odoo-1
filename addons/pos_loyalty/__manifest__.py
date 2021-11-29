# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': "Point of Sale - Coupons & Loyalty",
    'version': '2.0',
    'category': 'Sales/Point Of Sale',
    'sequence': 6,
    'summary': 'Use Coupons, Gift Cards and Loyalty programs in Point of Sale',
    'description': '',
    'depends': ['loyalty', 'point_of_sale'],
    'data': [
        'data/security/ir.model.access.csv',
        'data/default_barcode_patterns.xml',
        # 'data/mail_template_data.xml', TODO: adapt
    ],
    'demo': [
        # 'data/pos_loyalty_demo.xml', TODO: adapt
    ],
    'installable': True,
    'assets': {
        'point_of_sale.assets': [
            'pos_loyalty/static/src/css/Loyalty.scss',
            'pos_loyalty/static/src/js/ActivePrograms.js',
            'pos_loyalty/static/src/js/loyalty.js',
            'pos_loyalty/static/src/js/Orderline.js',
            'pos_loyalty/static/src/js/PaymentScreen.js',
            'pos_loyalty/static/src/js/ProductScreen.js',
            'pos_loyalty/static/src/js/ControlButtons/GiftCardButton.js',
            'pos_loyalty/static/src/js/ControlButtons/ResetProgramsButton.js',
            'pos_loyalty/static/src/js/ControlButtons/PromoCodeButton.js',
        ],
        'web.assets_tests': [
            'pos_loyalty/static/src/js/tours/**/*',
        ],
        'web.assets_qweb': [
            'pos_loyalty/static/src/xml/**/*',
        ],
    },
    'license': 'LGPL-3',
}
