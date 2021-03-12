# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.


{
    'name': 'Live Event Tracks',
    'category': 'Marketing/Events',
    'sequence': 1006,
    'version': '1.0',
    'summary': 'Support live tracks: streaming, participation, youtube',
    'website': 'https://www.odoo.com/page/events',
    'description': "",
    'depends': [
        'website_event_track',
    ],
    'data': [
        'views/event_track_templates_list.xml',
        'views/event_track_templates_page.xml',
        'views/event_track_views.xml',
    ],
    'demo': [
        'data/event_track_demo.xml'
    ],
    'application': False,
    'installable': True,
    'assets': {
        'web.assets_frontend': [
            # after //link[last()]
            'website_event_track_live/static/src/scss/website_event_track_live.scss',
            # after //script[last()]
            'website_event_track_live/static/src/js/website_event_track_suggestion.js',
            # after //script[last()]
            'website_event_track_live/static/src/js/website_event_track_live.js',
        ],
        'web.assets_qweb': [
            'website_event_track_live/static/src/xml/website_event_track_live_templates.xml',
        ],
    }
}
