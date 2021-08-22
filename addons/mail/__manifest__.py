# -*- coding: utf-8 -*-

{
    'name': 'Discuss',
    'version': '1.5',
    'category': 'Productivity/Discuss',
    'sequence': 145,
    'summary': 'Chat, mail gateway and private channels',
    'description': "",
    'website': 'https://www.odoo.com/app/discuss',
    'depends': ['base', 'base_setup', 'bus', 'web_tour'],
    'data': [
        'wizard/invite_view.xml',
        'wizard/mail_blacklist_remove_view.xml',
        'wizard/mail_compose_message_view.xml',
        'wizard/mail_resend_cancel_views.xml',
        'wizard/mail_resend_message_views.xml',
        'wizard/mail_template_preview_views.xml',
        'views/mail_message_subtype_views.xml',
        'views/mail_tracking_views.xml',
        'views/mail_notification_views.xml',
        'views/mail_message_views.xml',
        'views/mail_mail_views.xml',
        'views/mail_followers_views.xml',
        'views/mail_channel_partner_views.xml',
        'views/mail_channel_views.xml',
        'views/mail_shortcode_views.xml',
        'views/mail_activity_views.xml',
        'views/res_config_settings_views.xml',
        'data/res_partner_data.xml',
        'data/mail_message_subtype_data.xml',
        'data/mail_templates.xml',
        'data/mail_channel_data.xml',
        'data/mail_activity_data.xml',
        'data/ir_cron_data.xml',
        'security/mail_security.xml',
        'security/ir.model.access.csv',
        'views/mail_alias_views.xml',
        'views/res_users_views.xml',
        'views/mail_template_views.xml',
        'views/ir_actions_views.xml',
        'views/ir_model_views.xml',
        'views/res_partner_views.xml',
        'views/mail_blacklist_views.xml',
        'views/mail_menus.xml',
    ],
    'demo': [
        'data/mail_channel_demo.xml',
    ],
    'installable': True,
    'application': True,
    'assets': {
        'web._assets_primary_variables': [
            'mail/static/src/scss/variables/primary_variables.scss',
        ],
        'web.assets_backend': [
            # depends on BS variables, can't be loaded in assets_primary or assets_secondary
            'mail/static/src/scss/variables/derived_variables.scss',
            # defines mixins and variables used by multiple components
            'mail/static/src/components/notification_list/notification_list_item.scss',
            'mail/static/src/js/**/*.js',
            'mail/static/src/utils/*/*.js',
            'mail/static/src/utils/messaging_component.js',
            'mail/static/src/utils/utils.js',
            'mail/static/src/scss/*.scss',
            'mail/static/src/component_hooks/*/*.js',
            'mail/static/src/components/*/*.js',
            'mail/static/src/components/*/*.scss',
            'mail/static/src/model/*.js',
            'mail/static/src/models/*/*.js',
            'mail/static/src/services/*/*.js',
            'mail/static/src/webclient/commands/*.js',
            'mail/static/src/widgets/*/*.js',
            'mail/static/src/widgets/*/*.scss',
        ],
        'web.assets_backend_prod_only': [
            'mail/static/src/main.js',
        ],
        'web.assets_tests': [
            'mail/static/tests/tours/**/*',
        ],
        'web.tests_assets': [
            'mail/static/src/utils/test_utils.js',
            'mail/static/tests/helpers/mock_models.js',
            'mail/static/tests/helpers/mock_server.js',
        ],
        'web.qunit_suite_tests': [
            'mail/static/tests/*.js',
            'mail/static/tests/systray/systray_activity_menu_tests.js',
            'mail/static/tests/tools/debug_manager_tests.js',
            'mail/static/tests/webclient/commands/*.js',
            'mail/static/src/components/*/tests/*.js',
            'mail/static/src/model/tests/**/*.js',
            'mail/static/src/models/*/tests/*.js',
            'mail/static/src/services/*/tests/*.js',
            'mail/static/src/utils/*/tests/*.js',
            'mail/static/src/widgets/*/tests/*.js',
        ],
        'web.qunit_mobile_suite_tests': [
            'mail/static/src/components/*/mobile_tests/*.js',
        ],
        'web.assets_qweb': [
            'mail/static/src/xml/*.xml',
            'mail/static/src/components/*/*.xml',
        ],
    },
    'license': 'LGPL-3',
}
