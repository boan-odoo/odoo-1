# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import http
from odoo.http import request


class SmsController(http.Controller):

    @http.route('/sms/status', type='json', auth='public', csrf=False)
    def update_sms_status(self, request_uuid, sms_status):
        sms = request.env['sms.sms'].sudo().search([('request_uuid', '=', request_uuid)])
        if sms:
            sms.update_status(sms_status)
        return 'OK'
