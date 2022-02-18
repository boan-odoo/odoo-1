# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class Channel(models.Model):
    _inherit = 'mail.channel'

    subscription_department_ids = fields.Many2many(
        'hr.department', string='HR Departments',
        help='Automatically subscribe members of those departments to the channel.')

    # CONSTRAINTS

    @api.constrains('subscription_department_ids')
    def _constraint_subscription_department_ids_channel(self):
        failing_channel = self.sudo().filtered(lambda channel: channel.channel_type!='channel' and channel.subscription_department_ids)
        if failing_channel:
            raise ValidationError(_("The following channels have department auto-subscription but are not of right type 'channel': %(channel_names)s"), channel_names = ', '.join(failing_channel.mapped('name')))

    def _subscribe_users_automatically_get_members(self):
        """ Auto-subscribe members of a department to a channel """
        new_members = super(Channel, self)._subscribe_users_automatically_get_members()
        for channel in self:
            new_members[channel.id] = list(
                set(new_members[channel.id]) |
                set((channel.subscription_department_ids.member_ids.user_id.partner_id - channel.channel_partner_ids).ids)
            )
        return new_members

    def write(self, vals):
        res = super(Channel, self).write(vals)
        if vals.get('subscription_department_ids'):
            self._subscribe_users_automatically()
        return res
