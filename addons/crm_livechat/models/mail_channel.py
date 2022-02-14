# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, _
from odoo.tools import html2plaintext, html_escape


class MailChannel(models.Model):
    _inherit = 'mail.channel'

    def execute_command_lead(self, **kwargs):
        partner = self.env.user.partner_id
        key = kwargs['body']
        if key.strip() == '/lead':
            msg = _('Create a new lead (/lead lead title)')
        else:
            lead = self._convert_visitor_to_lead(partner, key)
            msg = _('Created a new lead: <a href="#" data-oe-id="%s" data-oe-model="crm.lead">%s</a>') % (lead.id, html_escape(lead.name))
        self._send_transient_message(partner, msg)

    def _prepare_lead_description(self):
        """
        Converting message body back to plaintext for correct data formatting in description
        if public user is part of the chat: consider lead to be linked to an anonymous user
        whatever the participants. Otherwise keep only share partners (no user or portal user)
        to link to the lead.
        """
        return ''.join(
            '%s: %s<br/>' % (message.author_id.name or self.anonymous_name, html2plaintext(message.body))
            for message in self.message_ids.sorted('id')
        )

    def _convert_visitor_to_lead(self, partner, key):
        """ Create a lead from channel /lead command
        :param partner: internal user partner (operator) that created the lead;
        :param key: operator input in chat ('/lead Lead about Product')
        """
        customers = self.env['res.partner']
        for customer in self.with_context(active_test=False).channel_partner_ids.filtered(lambda p: p != partner and p.partner_share):
            if customer.is_public:
                customers = self.env['res.partner']
                break
            else:
                customers |= customer

        utm_source = self.env.ref('crm_livechat.utm_source_livechat', raise_if_not_found=False)
        return self.env['crm.lead'].create({
            'name': html2plaintext(key[5:]),
            'partner_id': customers[0].id if customers else False,
            'user_id': False,
            'team_id': False,
            'description': self._prepare_lead_description(),
            'referred': partner.name,
            'source_id': utm_source and utm_source.id,
        })

    def _fetch_user_input_values(self):
        values = {}
        filtered_message_ids = self.livechat_chatbot_message_ids.filtered(
            lambda m: m.chatbot_step_id.step_type in ['question_email', 'question_phone'])
        for message in filtered_message_ids:
            step = message.chatbot_step_id.step_type
            if step == 'question_email':
                values['email_from'] = message.chatbot_user_raw_answer
            elif step == 'question_phone':
                values['phone'] = message.chatbot_user_raw_answer
        return values

    def _prepare_lead_values(self, step_id):
        return {
            'name': _("%s's New Lead", step_id.chatbot_id.name),
            'type': 'lead' if step_id.team_id.use_leads else 'opportunity',
            'user_id': self.livechat_operator_id.user_id.id,
            'team_id': step_id.team_id.id,
            'description': self._prepare_lead_description(),
            'source_id': step_id.chatbot_id.utm_source_id.id,
        }

    def _chatbot_process_step(self, step_id):
        self.ensure_one()

        if step_id.step_type == 'create_lead':
            self.env['crm.lead'].create({
                **self._prepare_lead_values(step_id),
                **self._fetch_user_input_values()
            })

        super(MailChannel, self)._chatbot_process_step(step_id)
