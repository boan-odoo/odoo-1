# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api
from datetime import datetime


class CalendarLeaves(models.Model):
    _inherit = "resource.calendar.leaves"

    holiday_id = fields.Many2one("hr.leave", string='Leave Request')

    def _reevaluate_leaves(self, leaves):
        for leave in leaves:
            if leave.state == 'validate':
                leave.action_refuse()
                leave.action_draft()
                leave._compute_number_of_days()
                if leave.number_of_days > 0.0:
                    leave.action_confirm()
                    leave.action_validate()
            else:
                leave._compute_number_of_days()

            if leave.number_of_days == 0.0:
                leave.force_cancel("A new public holiday completely overrides this leave")
        return True

    @api.model
    def create(self, vals):
        res = super().create(vals)
        if not 'resource_id' in vals or not vals['resource_id']:
            date_from = datetime.fromisoformat(vals['date_from']) if isinstance(vals['date_from'], str) else vals['date_from']
            date_to = datetime.fromisoformat(vals['date_to']) if isinstance(vals['date_to'], str) else vals['date_to']
            leaves = self.env['hr.leave'].search([
                ('date_to', '>', date_from),
                ('date_from', '<', date_to),
                ('state', '!=', 'refuse')
            ])
            self._reevaluate_leaves(leaves)
        return res

    def write(self, vals):
        old_calendar_leaves = []
        for record in self:
            old_calendar_leaves.append({
                'resource_id': record.resource_id,
                'date_from': record.date_from,
                'date_to': record.date_to,
            })

        res = super().write(vals)

        # reevaluate for old dates
        for record in old_calendar_leaves:
            if not record['resource_id']:
                leaves = self.env['hr.leave'].search([
                    ('date_to', '>', record['date_from']),
                    ('date_from', '<', record['date_to']),
                    ('state', '!=', 'refuse')
                ])
                self._reevaluate_leaves(leaves)

        # reevaluate for new dates
        for record in self:
            calendar_leave = {
                'resource_id': record.resource_id,
                'date_from': record.date_from,
                'date_to': record.date_to,
            }
            if not calendar_leave['resource_id']:
                leaves = self.env['hr.leave'].search([
                    ('date_to', '>', calendar_leave['date_from']),
                    ('date_from', '<', calendar_leave['date_to']),
                    ('state', '!=', 'refuse')
                ])
                self._reevaluate_leaves(leaves)
        return res

    def unlink(self):
        calendar_leaves = [{
            'resource_id': record.resource_id,
            'date_from': record.date_from,
            'date_to': record.date_to,
        } for record in self]

        res = super().unlink()

        for calendar_leave in calendar_leaves:
            if not calendar_leave['resource_id']:
                leaves = self.env['hr.leave'].search([
                    ('date_to', '>', calendar_leave['date_from']),
                    ('date_from', '<', calendar_leave['date_to']),
                    ('state', '!=', 'refuse')
                ])
                self._reevaluate_leaves(leaves)

        return res
