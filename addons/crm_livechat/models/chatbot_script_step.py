# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, _


class ChatbotScriptStep(models.Model):
    _inherit = 'im_livechat.chatbot.script_step'

    step_type = fields.Selection(selection_add=[('create_lead', 'Create Lead')], ondelete={'create_lead': 'cascade'})
    team_id = fields.Many2one('crm.team', string='Sales Team', ondelete='set null')
