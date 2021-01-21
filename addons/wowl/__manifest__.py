

# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Wowl',
    'category': 'Hidden',
    'version': '1.0',
    'description':
        """
Odoo Web core module written in Owl.
        """,
    'depends': [
        'base',
        'web'  # LPE temporary: we call some assets defined there
    ],
    'auto_install': True,
    'data': [
        'views/templates.xml',
        'views/ent_templates.xml',
    ],
    'assets': {
        'js': [
            'static/src/**/*',
        ],
        'tests_js': [
            'static/src/action_manager/**/*',
            'static/src/components/**/*',
            'static/src/core/**/*',
            'static/src/crash_manager/**/*',
            'static/src/debug_manager/**/*',
            'static/src/switch_company_menu/**/*',
            'static/src/effects/**/*',
            'static/src/legacy/**/*',
            'static/src/libs/**/*',
            'static/src/notifications/**/*',
            'static/src/py/**/*',
            'static/src/services/**/*',
            'static/src/utils/**/*',
            'static/src/views/**/*',
            'static/src/web_enterprise/**/*',
            'static/src/webclient/**/*',
            'static/src/env.js',
            'static/tests/**/*',
        ],
        'owl_qweb': [
            'static/src/components/**/*',
            'static/src/action_manager/**/*',
            'static/src/debug_manager/**/*',
            'static/src/switch_company_menu/**/*',
            'static/src/effects/**/*',
            'static/src/notifications/**/*',
            'static/src/webclient/**/*',
            'static/src/crash_manager/**/*',
            'static/src/views/**/*',
            'static/src/web_enterprise/webclient/navbar/*',
            'static/src/web_enterprise/**/*',
        ],
        'style': [
            'static/src/utils/**/*',
            'static/src/components/**/*',
            'static/src/action_manager/**/*',
            'static/src/debug_manager/**/*',
            'static/src/notifications/**/*',
            'static/src/effects/**/*',
            'static/src/webclient/**/*',
            'static/src/views/**/*',
            'static/src/crash_manager/**/*',
            'static/src/services/**/*',
            'static/src/web_enterprise/webclient/burger_menu/**/*'
        ]
    },
}
