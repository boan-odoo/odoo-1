# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models


class MailMessage(models.Model):
    _inherit = 'mail.message'

    def _message_format(self, fnames, format_reply=True):
        """Override to remove email_from and to return the livechat username if applicable.
        A third param is added to the author_id tuple in this case to be able to differentiate it
        from the normal name in client code."""
        vals_list = super()._message_format(fnames=fnames, format_reply=format_reply)
        for vals in vals_list:
            message_sudo = self.browse(vals['id']).sudo().with_prefetch(self.ids)
            mail_channel = self.env['mail.channel'].browse(message_sudo.res_id) if message_sudo.model == 'mail.channel' else self.env['mail.channel']
            if mail_channel.channel_type == 'livechat':
                vals.pop('email_from')
                if message_sudo.author_id.user_livechat_username:
                    vals['author_id'] = (message_sudo.author_id.id, message_sudo.author_id.user_livechat_username, message_sudo.author_id.user_livechat_username)
                if mail_channel.livechat_chatbot_current_step_id \
                        and message_sudo.author_id == mail_channel.livechat_chatbot_current_step_id.chatbot_id.operator_partner_id:
                    chatbot_mail_message_id = self.env['im_livechat.chatbot.mail.message'].sudo().search([
                        ('mail_message_id', '=', message_sudo.id)], limit=1)
                    if chatbot_mail_message_id.chatbot_step_id:
                        vals['chatbot_step_answers'] = [{
                            'id': answer.id,
                            'label': answer.name
                        } for answer in chatbot_mail_message_id.chatbot_step_id.answer_ids]
                    if chatbot_mail_message_id.chatbot_question_answer_id:
                        vals['chatbot_selected_answer_id'] = chatbot_mail_message_id.chatbot_question_answer_id.id
        return vals_list
