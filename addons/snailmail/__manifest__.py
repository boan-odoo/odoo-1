# -*- coding: utf-8 -*-
{
    'name': "Snail Mail",
    'website': "https://www.odoo.com",
    'description': """
Allows users to send invoices by post
=====================================================
        """,
    'category': 'Tools',
    'version': '0.1',

    'depends': ['account', 'iap'],

    'data': [
        'data/mail_activity_data.xml',
        'wizard/multi_compose_message_views.xml',
        'views/res_config_settings_views.xml',
        'views/snailmail_assets.xml',
    ],
}
