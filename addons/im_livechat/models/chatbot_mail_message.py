# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields


class ChatbotMailMessage(models.Model):
    """ Chatbot Mail Message
        We create a new model to store the related step to a mail.message and the user's answer.
        We do this in a new model to avoid bloating the 'mail.message' model.
    """

    _name = 'im_livechat.chatbot.mail.message'
    _description = 'Chatbot Mail Message'

    mail_message_id = fields.Many2one('mail.message', string='Related Mail Message')
    mail_channel_id = fields.Many2one('mail.channel', string='Related Mail Channel', required=True)
    chatbot_step_id = fields.Many2one('im_livechat.chatbot.script_step', string='Chatbot Step', required=True)
    chatbot_question_answer_id = fields.Many2one('im_livechat.chatbot.script_question_answer', string="User's answer")
    chatbot_user_raw_answer = fields.Text(string="User's raw answer")
