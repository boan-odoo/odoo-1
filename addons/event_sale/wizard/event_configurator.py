# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import _, api, models, fields
from odoo.exceptions import ValidationError


class EventConfigurator(models.TransientModel):
    _name = 'event.event.configurator'
    _description = 'Event Configurator'

    product_id = fields.Many2one('product.product', string="Product", readonly=True)
    event_id = fields.Many2one('event.event', string="Event")
    event_ticket_id = fields.Many2one('event.event.ticket', string="Event Ticket")

    @api.constrains('event_id', 'event_ticket_id')
    def check_event_id(self):
        for record in self:
            if record.event_id.id != record.event_ticket_id.event_id.id:
                raise ValidationError(_('Invalid event / ticket choice(s)'))
