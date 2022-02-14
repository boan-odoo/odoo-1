# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'CRM Livechat',
    'category': 'Sales/CRM',
    'summary': 'Create lead from livechat conversation',
    'data': [
        'data/crm_livechat_chatbot_demo.xml',
        'data/utm_data.xml',

        'views/chatbot_script_step_views.xml',
    ],
    'depends': [
        'crm',
        'im_livechat'
    ],
    'description': 'Create new lead with using /lead command in the channel',
    'auto_install': True,
    'license': 'LGPL-3',
    'assets': {
        'mail.assets_discuss_public': [
            'crm_livechat/static/src/models/*/*.js',
        ],
        'web.assets_backend': [
            'crm_livechat/static/src/models/*/*.js',
        ],
        'im_livechat.external_lib': [
            'crm_livechat/static/src/legacy/public_livechat_chatbot.js',
        ],
    },
}
