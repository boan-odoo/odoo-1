# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, _
from odoo.exceptions import ValidationError
from odoo.osv import expression
from odoo.tools import html2plaintext, single_email_re, email_normalize


class ChatbotScriptStep(models.Model):
    _name = 'im_livechat.chatbot.script_step'
    _description = 'Chatbot Script Step'
    _order = 'sequence, id'

    message = fields.Text(string='Message')
    sequence = fields.Integer(string='Sequence')
    chatbot_id = fields.Many2one(
        'im_livechat.chatbot.script', string='Chatbot', required=True, ondelete='cascade')
    step_type = fields.Selection([
        ('text', 'Text'),
        ('question_selection', 'Question'),
        ('question_email', 'Email'),
        ('question_phone', 'Phone'),
        ('forward_operator', 'Forward to Operator'),
    ], default='text', required=True)
    # answers
    answer_ids = fields.One2many(
        'im_livechat.chatbot.script_question_answer', 'step_id', string='Answers')
    triggering_answer_ids = fields.Many2many(
        'im_livechat.chatbot.script_question_answer', 'chatbot_script_chatbot_script_question_answer_rel',
        string='Only If', help='Show this step only if all of these answers have been selected.')
    # forwar-operator specifics
    message_no_operator = fields.Text(string='No Operator Message',
        help='If there are no operators available when forwarding, this message will be sent instead.')

    def _fetch_next_step(self, selected_answer_ids):
        self.ensure_one()
        domain = [('chatbot_id', '=', self.chatbot_id.id), ('sequence', '>', self.sequence)]
        if selected_answer_ids:
            domain = expression.AND([domain, [
                '|',
                ('triggering_answer_ids', '=', False),
                ('triggering_answer_ids', 'in', selected_answer_ids.ids)]])
        return self.env['im_livechat.chatbot.script_step'].sudo().search(domain, limit=1)

    def _filtered_welcome_steps(self):
        """ Returns a sub-set of self that only contains the "welcoming steps".
        We consider those as all the steps the bot will say before expecting a first answer from
        the end user.

        Example 1:
        - step 1 (question_selection): What do you want to do? - Create a Lead, -Create a Ticket
        - step 2 (text): Thank you for visiting our website!
        -> The welcoming steps will only contain step 1, since directly after that we expect an
        input from the user

        Example 2:
        - step 1 (text): Hello! I'm a bot!
        - step 2 (text): I am here to help lost users.
        - step 3 (question_selection): What do you want to do? - Create a Lead, -Create a Ticket
        - step 4 (text): Thank you for visiting our website!
        -> The welcoming steps will contain steps 1, 2 and 3.
        Meaning the bot will have a small monologue with himself before expecting an input from the
        end user.

        This is important because we need to display those welcoming steps in a special fashion on
        the frontend, since those are not inserted into the mail.channel as actual mail.messages,
        to avoid bloating the channels with bot messages if the end-user never interacts with it. """

        welcome_steps = self.env['im_livechat.chatbot.script_step']
        for step in self:
            welcome_steps += step
            if step.step_type != 'text':
                break

        return welcome_steps

    def _is_last_step(self, mail_channel):
        self.ensure_one()

        # when forwarding an operator, we end the script (the human takes over)
        if self.step_type == 'forward_operator':
            return True

        # if it's not a question and if there is no next step, then we end the script
        if self.step_type != 'question_selection' and not self._fetch_next_step(
           mail_channel.livechat_chatbot_message_ids.mapped('chatbot_question_answer_id')):
            return True

        return False

    def _process_answer(self, mail_channel, mail_message):
        """
        Process user's answer depending on the step_type.

        :param mail_channel:
        :param mail_message:
        :return: script step to display next
        :rtype: 'im_livechat.chatbot.script_step'
        """
        self.ensure_one()

        user_raw_answer = html2plaintext(mail_message.body)
        mail_message_id = self.env['im_livechat.chatbot.mail.message'].search([
            ('mail_channel_id', '=', mail_channel.id),
            ('chatbot_step_id', '=', self.id),
        ], limit=1)

        update_values = {}
        if self.step_type == 'question_selection':
            # Update 'chatbot.mail.message' with the user's answer
            chatbot_question_answer_id = self.answer_ids.filtered(lambda a: a.name == user_raw_answer)
            if not chatbot_question_answer_id:
                raise ValidationError(_('"%s" is not a valid answer for this step', user_raw_answer))
            update_values.update({
                'chatbot_question_answer_id': chatbot_question_answer_id.id,
                'chatbot_user_raw_answer': user_raw_answer,
            })

        elif self.step_type == 'question_email':
            if not single_email_re.match(user_raw_answer):
                # if this error is raised, display an error message but do not go to next step
                raise ValidationError(_('"%s" is not a valid email.', user_raw_answer))
            update_values['chatbot_user_raw_answer'] = email_normalize(user_raw_answer)

        elif self.step_type == 'question_phone':
            update_values['chatbot_user_raw_answer'] = user_raw_answer

        if mail_message_id:
            mail_message_id.write(update_values)
        else:
            # there is no existing chatbot mail message
            # -> this can happen for the "welcome message" (first message of the bot)
            # which is NOT registered in the conversation
            # to avoid creating messsages in the channel if the user never uses the bot
            # in that case we create a chatbot message without a reference to a 'mail.message'
            self.env['im_livechat.chatbot.mail.message'].create({
                'mail_channel_id': mail_channel.id,
                'chatbot_step_id': self.id,
                **update_values
            })

        return self._fetch_next_step(mail_channel.livechat_chatbot_message_ids.chatbot_question_answer_id)
