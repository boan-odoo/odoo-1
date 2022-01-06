# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.addons.mail.controllers.discuss import DiscussController
from odoo import http
from odoo.http import request

class MailbotController(DiscussController):
    @http.route('/mail/init_messaging', methods=['POST'], type='json', auth='public')
    def mail_init_messaging(self):
        values = super().mail_init_messaging()
        values['odoobot_initialized'] = request.env.user.odoobot_state not in [False, 'not_initialized']
        return values
