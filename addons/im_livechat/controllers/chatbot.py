# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import http
from odoo.http import request


class LivechatController(http.Controller):

    @http.route('/im_livechat/notify_operator_typing', type='json', auth="public", cors="*")
    def livechat_notify_operator_typing(self, uuid):
        channel = request.env['mail.channel'].sudo().search([('uuid', '=', uuid)], limit=1)
        if channel.livechat_operator_id and channel.livechat_operator_id.user_ids:
            channel.with_user(channel.livechat_operator_id.user_ids[0]).notify_typing(is_typing=True)
