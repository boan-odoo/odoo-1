# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models
from odoo.http import request
from odoo.addons.http_routing.models.ir_http import url_for
from odoo.tools import is_html_empty, lazy


class IrQWeb(models.AbstractModel):
    _inherit = "ir.qweb"

    def _prepare_environment_values(self):
        """ Returns the qcontext : rendering context with portal specific value (required
            to render portal layout template)
        """
        qcontext = super()._prepare_environment_values()
        if request and getattr(request, 'is_frontend', False):
            Lang = request.env['res.lang']
            qcontext.update(dict(
                self._context.copy(),
                url_for=url_for,
                is_html_empty=is_html_empty,
            ))
            qcontext['languages'] = lazy(lambda: [lang for
                        lang in Lang.get_available()
                        if lang[0] in request.env['ir.http']._get_frontend_langs()])
        return qcontext
