# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _
from odoo.osv import expression


class CalendarLeaves(models.Model):
    _inherit = "resource.calendar.leaves"

    holiday_id = fields.Many2one("hr.leave", string='Leave Request')

    def _reevaluate_leaves(self, leaves):
        if not leaves:
            return
        validated_leaves = leaves.filtered(lambda l: l.state == 'validate')
        validated_leaves.action_refuse()
        validated_leaves.action_draft()
        leaves._compute_number_of_days()
        leaves_to_validate = validated_leaves.filtered(lambda l: l.number_of_days > 0)
        leaves_to_validate.action_confirm()
        leaves_to_validate.action_validate()
        for leave in leaves:
            if leave.number_of_days == 0.0:
                leave.force_cancel(_("a new public holiday completely overrides this leave"), 1)
            else:
                leave.message_post(body=_("Due to a change in global time offs, this time off duration has been modified"), subtype_id=1)
        return True

    @api.model_create_multi
    def create(self, vals_list):
        res = super().create(vals_list)
        domain = []
        for vals in vals_list:
            if not 'resource_id' in vals or not vals['resource_id']:
                date_from = fields.Date.to_date(vals['date_from'])
                date_to = fields.Date.to_date(vals['date_to'])
                domain = expression.OR([domain, [
                    ('date_to', '>', date_from),
                    ('date_from', '<', date_to)]
                ])
        if domain:
            domain = expression.AND([domain, [('state', '!=', 'refuse')]])
            leaves = self.env['hr.leave'].search(domain)
            self._reevaluate_leaves(leaves)
        return res

    def write(self, vals):
        #get all concerned dates
        calendar_leaves = []
        for record in self:
            calendar_leaves.append({
                'resource_id': record.resource_id,
                'date_from': record.date_from,
                'date_to': record.date_to,
            })
        res = super().write(vals)
        for record in self:
            calendar_leaves.append({
                'resource_id': record.resource_id,
                'date_from': record.date_from,
                'date_to': record.date_to,
            })

        # create domain and reevaluate
        domain = []
        for record in calendar_leaves:
            if not record['resource_id']:
                domain = expression.OR([domain, [
                    ('date_to', '>', record['date_from']),
                    ('date_from', '<', record['date_to'])]
                ])
        if domain:
            domain = expression.AND([domain, [('state', '!=', 'refuse')]])
            leaves = self.env['hr.leave'].search(domain)
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
