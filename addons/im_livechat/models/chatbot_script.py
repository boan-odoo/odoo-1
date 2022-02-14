# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields


class ChatbotScript(models.Model):
    _name = 'im_livechat.chatbot.script'
    _description = 'Chatbot'
    _inherit = ['image.mixin']
    _inherits = {'utm.source': 'utm_source_id'}

    step_ids = fields.One2many('im_livechat.chatbot.script_step', 'chatbot_id', string='Script Steps')
    utm_source_id = fields.Many2one('utm.source', string='UTM Source', ondelete='restrict', required=True)
