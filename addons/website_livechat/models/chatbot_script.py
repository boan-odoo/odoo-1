# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models


class ChatbotScript(models.Model):
    _inherit = 'im_livechat.chatbot.script'

    def _prepare_operator_partner_values(self, name, image):
        res = super()._prepare_operator_partner_values(name, image)
        res['is_published'] = image
        return res
