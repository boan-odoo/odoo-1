# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': "Shopper's Wishlist",
    'summary': 'Allow shoppers to enlist products',
    'description': """
Allow shoppers of your eCommerce store to create personalized collections of products they want to buy and save them for future reference.
    """,
    'author': 'Odoo SA',
    'category': 'Website/Website',
    'version': '1.0',
    'depends': ['website_sale'],
    'data': [
        'security/website_sale_wishlist_security.xml',
        'security/ir.model.access.csv',
        'views/website_sale_wishlist_template.xml',
        'views/snippets.xml',
    ],
    'installable': True,
    'assets': {
        'assets_frontend': [
            # inside .
            'website_sale_wishlist/static/src/scss/website_sale_wishlist.scss',
            # inside .
            'website_sale_wishlist/static/src/js/website_sale_wishlist.js',
        ],
        'assets_tests': [
            # inside .
            'website_sale_wishlist/static/tests/tours/website_sale_wishlist.js',
        ],
    }
}
