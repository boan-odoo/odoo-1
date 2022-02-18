# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from odoo.addons.website_sale.controllers.main import WebsiteSale
import json


class WebsiteSaleProductComparison(WebsiteSale):

    @http.route('/shop/compare', type='http', auth="public", website=True, sitemap=False)
    def product_compare(self, **post):
        values = {}
        product_ids = [int(i) for i in post.get('products', '').split(',') if i.isdigit()]
        if not product_ids:
            return request.redirect("/shop")
        # use search to check read access on each record/ids
        products = request.env['product.product'].search([('id', 'in', product_ids)])
        values['products'] = products.with_context(display_default_code=False)
        return request.render("website_sale_comparison.product_compare", values)

    @http.route(['/shop/get_product_data'], type='json', auth="public", website=True)
    def get_product_data(self, product_ids, cookies=None):
        ret = {}

        website = request.env['website'].get_current_website()
        pricelist = website.pricelist_id
        products = request.env['product.product'].search([('id', 'in', product_ids)])

        if cookies is not None:
            ret['cookies'] = json.dumps(request.env['product.product'].search([('id', 'in', list(set(product_ids + cookies)))]).ids)

        products = products.with_context(pricelist=pricelist.id, display_default_code=False)
        for product in products:
            ret[product.id] = {
                'render': request.env['ir.ui.view']._render(
                    "website_sale_comparison.product_product",
                    {'product': product, 'website': website}
                ),
                'product': dict(id=product.id, name=product.name, display_name=product.display_name),
            }
        return ret
