# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': "Knowledge",
    'summary': 'Centralise, manage, share and grow your knowledge library',
    'description': "Centralise, manage, share and grow your knowledge library",
    'category': 'Knowledge',
    'version': '0.1',
    'depends': [
        'web',
        'web_editor',
        'mail'
    ],
    'data': [
        'data/knowledge_data.xml',
        'views/knowledge_views.xml',
        'views/knowledge_templates.xml',
        'security/ir.model.access.csv',
        'security/security.xml',
    ],
    'demo': ['data/knowledge_demo.xml'],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
    'assets': {
        'web.assets_backend': [
            'knowledge/static/src/scss/knowledge_views.scss',
            'knowledge/static/src/js/knowledge_controller.js',
            'knowledge/static/src/js/knowledge_model.js',
            'knowledge/static/src/js/knowledge_renderers.js',
            'knowledge/static/src/js/knowledge_views.js',
            'knowledge/static/src/js/wysiwyg.js',
            'knowledge/static/src/webclient/commands/*.js',
        ],
        'web.assets_qweb': [
            'knowledge/static/src/xml/knowledge_editor.xml',
            'knowledge/static/src/xml/knowledge_templates.xml'
        ]
    }
}
