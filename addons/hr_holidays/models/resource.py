# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class CalendarLeaves(models.Model):
    _inherit = "resource.calendar.leaves"

    holiday_id = fields.Many2one("hr.leave", string='Leave Request')

class ResourceCalendar(models.Model):
    _inherit = "resource.calendar"

    associated_leaves_count = fields.Integer("Leave Count", compute='_compute_associated_leaves_count')

    def _compute_associated_leaves_count(self):
        for calendar_leave in self:
            calendar_leave.associated_leaves_count = self.env['resource.calendar.leaves'].search_count([
                '&',
                ('resource_id', '=', False),
                ('calendar_id', 'in', [calendar_leave.id, False])
            ])
