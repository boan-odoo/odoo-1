# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo import api, SUPERUSER_ID, _
from . import controllers
from . import models
from . import wizard
from . import report


def uninstall_hook(cr, registry):
    ''' Need to reenable the `product` pricelist multi-company rule that were
        disabled to be 'overridden' for multi-website purpose
    '''
    env = api.Environment(cr, SUPERUSER_ID, {})
    pl_rule = env.ref('product.product_pricelist_comp_rule', raise_if_not_found=False)
    pl_item_rule = env.ref('product.product_pricelist_item_comp_rule', raise_if_not_found=False)
    multi_company_rules = pl_rule or env['ir.rule']
    multi_company_rules += pl_item_rule or env['ir.rule']
    multi_company_rules.write({'active': True})


def post_init_hook(cr, registry):
    ''' Need to add product filters to previously created website
    '''
    env = api.Environment(cr, SUPERUSER_ID, {})
    action = env.ref('website_sale.dynamic_snippet_products_action', raise_if_not_found=False)
    if action:
        for website in env['website'].search([]):
            env['website.snippet.filter'].create({
                'action_server_id': action.id,
                'field_names': 'display_name,description_sale,image_512,list_price',
                'limit': 16,
                'name': _('Products'),
                'website_id': website.id,
            })
