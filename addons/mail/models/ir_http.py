# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import odoo
from odoo import models, SUPERUSER_ID, _
from odoo.addons.web.controllers.main import HomeStaticTemplateHelpers
from odoo.exceptions import AccessError, MissingError
from odoo.http import request
from odoo.tools import consteq


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    def session_info(self):
        user = request.env.user
        result = super(IrHttp, self).session_info()
        if self.env.user.has_group('base.group_user'):
            result['notification_type'] = user.notification_type
        assets_discuss_public_hash = HomeStaticTemplateHelpers.get_qweb_templates_checksum(debug=request.session.debug, bundle='mail.assets_discuss_public')
        result['cache_hashes']['assets_discuss_public'] = assets_discuss_public_hash
        guest = self.env.context.get('guest')
        if not request.session.uid and guest:
            user_context = {'lang': guest.lang}
            mods = odoo.conf.server_wide_modules or []
            lang = user_context.get("lang")
            translation_hash = request.env['ir.translation'].sudo().get_web_translations_hash(mods, lang)
            result['cache_hashes']['translations'] = translation_hash
            result.update({
                'name': guest.name,
                'user_context': user_context,
            })
        return result

    def _document_check_access(self, model_name, document_id, access_token=None):
        """This method relies on access rules/rights and therefore it should not be called from a
        sudo env."""
        document = self.env[model_name].browse([document_id])
        document_sudo = document.with_user(SUPERUSER_ID).exists()
        if not document_sudo:
            raise MissingError(_("This document does not exist."))
        try:
            document.check_access_rights('read')
            document.check_access_rule('read')
        except AccessError:
            if not access_token or not document_sudo.access_token or not consteq(document_sudo.access_token, access_token):
                raise
        return document_sudo
