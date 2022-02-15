# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from pytz import timezone, UTC
from odoo import fields, models, api, _
from datetime import timedelta
from odoo.tools import date_utils
from odoo.osv import expression


class CalendarLeaves(models.Model):
    _inherit = "resource.calendar.leaves"

    holiday_id = fields.Many2one("hr.leave", string='Leave Request')

    def _get_domain(self, time_domain_dict):
        domain = []
        for record in time_domain_dict:
            domain = expression.OR([domain, [
                    ('date_to', '>', record['date_from']),
                    ('date_from', '<', record['date_to'])]
            ])
        return expression.AND([domain, [('state', '!=', 'refuse'), ('active', '=', 'True')]])

    def _get_time_domain_dict(self, time_domain_dict=None):
        if not time_domain_dict:
            time_domain_dict = []
        for record in self:
            if not record['resource_id']:
                time_domain_dict.append({
                    'date_from' : record['date_from'],
                    'date_to' : record['date_to']
                })
        return time_domain_dict

    def _split_leave_on_gto(self, leave, gto): #gto = global time off
        leave_start = date_utils.start_of(leave['date_from'], 'day')
        leave_end = date_utils.end_of(leave['date_to'] - timedelta(seconds=1), 'day')
        gto_start = date_utils.start_of(gto['date_from'], 'day')
        gto_end = date_utils.end_of(gto['date_to'], 'day')
        leave_tz = timezone(leave['employee_id']['resource_id']['tz'])

        if gto_start <= leave_start\
                and gto_end > leave_start\
                and gto_end < leave_end:
            leave.write({
                'date_from': leave_tz.localize(gto_end + timedelta(seconds=1))\
                        .astimezone(UTC).replace(tzinfo=None)
            })
            return self.env['hr.leave'].sudo()
        if gto_start > leave_start\
                and gto_end < leave_end:
            copys = {
                'date_from': leave['date_from'],
                'date_to': leave_tz.localize(gto_start - timedelta(seconds=1))\
                        .astimezone(UTC).replace(tzinfo=None)
            }
            leave.write({
                'date_from': leave_tz.localize(gto_end + timedelta(seconds=1))\
                        .astimezone(UTC).replace(tzinfo=None)
            })
            return leave.copy(copys)
        if gto_start > leave_start\
                and gto_start < leave_end\
                and gto_end >= leave_end:
            leave.write({
                'date_to': leave_tz.localize(gto_start - timedelta(seconds=1))\
                        .astimezone(UTC).replace(tzinfo=None)
            })
            return self.env['hr.leave'].sudo()

    def _split_leave(self, leave, time_domain_dict):
        new_leaves = self.env['hr.leave'].sudo()
        for record in sorted(
                filter(lambda r: r['date_to'] > leave['date_from'] and r['date_from'] < leave['date_to'], time_domain_dict),
                key=lambda r: r['date_from']):
            new_leave = self._split_leave_on_gto(leave, record)
            if new_leave:
                new_leaves |= new_leave
        return new_leaves

    def _reevaluate_leaves(self, time_domain_dict):
        if time_domain_dict:
            domain = self._get_domain(time_domain_dict)
            leaves = self.env['hr.leave'].search(domain)
            if not leaves:
                return

            previous_durations = [leave.number_of_days for leave in leaves]
            previous_states = [leave.state for leave in leaves]
            leaves.sudo().write({
                'state': 'draft',
            })
            leaves._compute_number_of_days()
            for previous_duration, leave, state in zip(previous_durations, leaves, previous_states):
                duration_difference = previous_duration - leave.number_of_days
                if duration_difference > 0 and leave.number_of_days > 0\
                        and leave['holiday_allocation_id']:
                    leave.message_post(body=_("Due to a change in global time offs, you have been granted %s day(s) back", duration_difference), subtype_id=1)
                if leave.number_of_days > previous_duration\
                        and leave['holiday_status_id']['name'] not in ['Sick Time Off']:
                    new_leaves = self._split_leave(leave, time_domain_dict)
                    leaves |= new_leaves
                    previous_states += [state for i in range(len(new_leaves))]

            for index, leave in enumerate(leaves):
                leave.write({'state': previous_states[index]})

            for leave in leaves:
                if leave.number_of_days == 0.0:
                    leave.force_cancel(_("a new public holiday completely overrides this leave"), 1)
        return True

    @api.model_create_multi
    def create(self, vals_list):
        res = super().create(vals_list)
        time_domain_dict = res._get_time_domain_dict()
        if time_domain_dict:
            self._reevaluate_leaves(time_domain_dict)
        return res

    def write(self, vals):
        time_domain_dict = self._get_time_domain_dict()
        res = super().write(vals)
        time_domain_dict = self._get_time_domain_dict(time_domain_dict)
        if time_domain_dict:
            self._reevaluate_leaves(time_domain_dict)

        return res

    def unlink(self):
        time_domain_dict = self._get_time_domain_dict()
        res = super().unlink()
        if time_domain_dict:
            self._reevaluate_leaves(time_domain_dict)

        return res
