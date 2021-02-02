{
    'name': 'Website Form',
    'category': 'Website/Website',
    'summary': 'Build custom web forms',
    'description': """
        Customize and create your own web forms.
        This module adds a new building block in the website builder in order to build new forms from scratch in any website page.
    """,
    'version': '1.0',
    'depends': ['website', 'mail', 'google_recaptcha'],
    'data': [
        'data/mail_mail_data.xml',
        
        'views/ir_model_views.xml',
        'views/snippets/snippets.xml',
        'views/snippets/s_website_form.xml',
        'views/website_form_templates.xml',
    ],
    'installable': True,
    'auto_install': True,
    'assets': {
        'assets_snippet_s_website_form_css_000': [
            # after //link[last()]
            'website_form/static/src/snippets/s_website_form/000.scss',
        ],
        'assets_snippet_s_website_form_css_001': [
            # after //link[last()]
            'website_form/static/src/snippets/s_website_form/001.scss',
        ],
        'assets_snippet_s_website_form_js_000': [
            # after //script[last()]
            'website_form/static/src/snippets/s_website_form/000.js',
        ],
        'assets_editor': [
            # inside .
            'website_form/static/src/scss/wysiwyg_snippets.scss',
            # inside .
            'website_form/static/src/snippets/s_website_form/options.js',
            # inside .
            'website_form/static/src/js/website_form_editor_registry.js',
        ],
        'assets_tests': [
            # inside .
            'website_form/static/tests/tours/website_form_editor.js',
        ],
    }
}
