# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import re
from collections import OrderedDict

from odoo import models
from odoo.http import request
from odoo.addons.base.models.assetsbundle import AssetsBundle
from odoo.addons.http_routing.models.ir_http import url_for
from odoo.osv import expression
from odoo.addons.website.models import ir_http
from odoo.tools import lazy

re_background_image = re.compile(r"(background-image\s*:\s*url\(\s*['\"]?\s*)([^)'\"]+)")


class AssetsBundleMultiWebsite(AssetsBundle):
    def _get_asset_url_values(self, id, unique, extra, name, sep, extension):
        website_id = self.env.context.get('website_id')
        website_id_path = website_id and ('%s/' % website_id) or ''
        extra = website_id_path + extra
        res = super(AssetsBundleMultiWebsite, self)._get_asset_url_values(id, unique, extra, name, sep, extension)
        return res

    def _get_assets_domain_for_already_processed_css(self, assets):
        res = super(AssetsBundleMultiWebsite, self)._get_assets_domain_for_already_processed_css(assets)
        current_website = self.env['website'].get_current_website(fallback=False)
        res = expression.AND([res, current_website.website_domain()])
        return res

    def get_debug_asset_url(self, extra='', name='%', extension='%'):
        website_id = self.env.context.get('website_id')
        website_id_path = website_id and ('%s/' % website_id) or ''
        extra = website_id_path + extra
        return super(AssetsBundleMultiWebsite, self).get_debug_asset_url(extra, name, extension)

class IrQWeb(models.AbstractModel):
    """ IrQWeb object for rendering stuff in the website context """

    _inherit = 'ir.qweb'

    URL_ATTRS = {
        'form':   'action',
        'a':      'href',
        'link':   'href',
        'script': 'src',
        'img':    'src',
    }

    def _prepare_environment_values(self):
        """ Returns the qcontext : rendering context with website specific value (required
            to render website layout template)
        """
        qcontext = super()._prepare_environment_values()

        if request and getattr(request, 'is_frontend', False):
            Website = self.env['website']
            editable = lazy(request.website.is_publisher)
            translatable = lazy(lambda: editable and self._context.get('lang') != request.env['ir.http']._get_default_lang().code)

            if self.env.user.has_group('website.group_website_publisher') and self.env.user.has_group('website.group_multi_website'):
                cur = lazy(Website.get_current_website)
                qcontext['multi_website_websites_current'] = lazy(lambda: cur.name)
                qcontext['multi_website_websites'] = lazy(lambda: [
                    {'website_id': website.id, 'name': website.name, 'domain': website.domain}
                    for website in Website.search([]) if website != cur
                ])

                cur_company = self.env.company
                qcontext['multi_website_companies_current'] = lazy(lambda: {'company_id': cur_company.id, 'name': cur_company.name})
                qcontext['multi_website_companies'] = lazy(lambda: [
                    {'company_id': comp.id, 'name': comp.name}
                    for comp in self.env.user.company_ids if comp != cur_company
                ])

            qcontext.update(
                main_object=self,
                website=request.website,
                is_view_active=request.website.is_view_active,
                res_company=lazy(request.website.company_id.sudo),
                translatable=translatable,
                editable=lazy(lambda: editable and not translatable),
            )

        return qcontext

    def _get_asset_bundle(self, xmlid, files, env=None, css=True, js=True):
        return AssetsBundleMultiWebsite(xmlid, files, env=env)

    def _post_processing_att(self, tagName, atts, options):
        if atts.get('data-no-post-process'):
            return atts

        atts = super(IrQWeb, self)._post_processing_att(tagName, atts, options)

        if tagName == 'img' and 'loading' not in atts:
            atts['loading'] = 'lazy'  # default is auto

        if options.get('inherit_branding') or options.get('rendering_bundle') or \
           options.get('edit_translations') or options.get('debug') or (request and request.session.debug):
            return atts

        website = ir_http.get_request_website()
        if not website and options.get('website_id'):
            website = self.env['website'].browse(options['website_id'])

        if not website:
            return atts

        name = self.URL_ATTRS.get(tagName)
        if request and name and name in atts:
            atts[name] = url_for(atts[name])

        if not website.cdn_activated:
            return atts

        data_name = f'data-{name}'
        if name and (name in atts or data_name in atts):
            atts = OrderedDict(atts)
            if name in atts:
                atts[name] = website.get_cdn_url(atts[name])
            if data_name in atts:
                atts[data_name] = website.get_cdn_url(atts[data_name])
        if isinstance(atts.get('style'), str) and 'background-image' in atts['style']:
            atts = OrderedDict(atts)
            atts['style'] = re_background_image.sub(lambda m: '%s%s' % (m.group(1), website.get_cdn_url(m.group(2))), atts['style'])

        return atts
