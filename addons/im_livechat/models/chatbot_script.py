# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, models, fields


class ChatbotScript(models.Model):
    _name = 'im_livechat.chatbot.script'
    _description = 'Chatbot'
    _inherit = ['image.mixin']
    _inherits = {'utm.source': 'utm_source_id'}

    step_ids = fields.One2many('im_livechat.chatbot.script_step', 'chatbot_id', string='Script Steps')
    utm_source_id = fields.Many2one('utm.source', string='UTM Source', ondelete='restrict', required=True)
    operator_partner_id = fields.Many2one('res.partner', string='Bot Operator',
        ondelete='restrict', required=True, copy=False)

    @api.model_create_multi
    def create(self, vals_list):
        operator_partners_values = [self._prepare_operator_partner_values(
            vals['name'],
            vals.get('image_1920', False),
        ) for vals in vals_list if 'operator_partner_id' not in vals and 'name' in vals]

        operator_partners = self.env['res.partner'].create(operator_partners_values)

        for vals, partner in zip(
            [vals for vals in vals_list if 'operator_partner_id' not in vals],
            operator_partners
        ):
            vals['operator_partner_id'] = partner.id

        return super().create(vals_list)

    def write(self, vals):
        res = super().write(vals)

        values_to_sync = {}
        if 'name' in vals:
            values_to_sync['name'] = vals['name']
        if 'image_1920' in vals:
            values_to_sync['image_1920'] = vals['image_1920']

        if values_to_sync:
            self.operator_partner_id.write(values_to_sync)

        return res

    def _prepare_operator_partner_values(self, name, image):
        return {
            'name': name,
            'image_1920': image,
            'active': False,
        }
