# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, models, fields
from odoo.exceptions import ValidationError


class ChatbotScript(models.Model):
    _name = 'im_livechat.chatbot.script'
    _description = 'Chatbot'
    _inherit = ['image.mixin']

    name = fields.Char(string='Name', required=True)
    step_ids = fields.One2many('im_livechat.chatbot.script_step', 'chatbot_id', string='Script Steps')
