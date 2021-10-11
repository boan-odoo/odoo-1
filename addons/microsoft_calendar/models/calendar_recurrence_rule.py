# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models

from odoo.addons.microsoft_calendar.utils.microsoft_calendar import MicrosoftCalendarService


class RecurrenceRule(models.Model):
    _name = 'recurrence.recurrence'
    _inherit = ['recurrence.recurrence', 'microsoft.calendar.sync']


    # Don't sync by default. Sync only when the recurrence is applied
    need_sync_m = fields.Boolean(default=False)

    microsoft_id = fields.Char('Microsoft Calendar Recurrence Id')

    def _compute_rrule(self):
        for recurrence in self:
            if recurrence.rrule != recurrence._rrule_serialize():
                recurrence.write({'rrule': recurrence._rrule_serialize()})

    def _inverse_rrule(self):
        for recurrence in self.filtered('rrule'):
            values = self._rrule_parse(recurrence.rrule, recurrence.dtstart)
            # We avoid to trigger patch in the inverse
            values.update({'need_sync_m': False})
            recurrence.write(values)

    def _apply_recurrence(self, specific_values_creation=None, model=None, generic_values_creation=None, keep_base=False):
        events = self.filtered('need_sync_m')._get_recurrent_records(model='calendar.event')
        detached_events = super()._apply_recurrence(specific_values_creation=specific_values_creation,
                                                    model=model,
                                                    generic_values_creation=generic_values_creation,
                                                    keep_base=keep_base
                                                    )

        microsoft_service = MicrosoftCalendarService(self.env['microsoft.service'])

        # If a synced event becomes a recurrence, the event needs to be deleted from
        # Microsoft since it's now the recurrence which is synced.
        # Those events are kept in the database and their microsoft_id is updated
        # according to the recurrence microsoft_id, therefore we need to keep an inactive copy
        # of those events with the original microsoft_id. The next sync will then correctly
        # delete those events from Microsoft.
        vals = []
        for event in events.filtered('microsoft_id'):
            if event.active and event.microsoft_id and not event.recurrence_id.microsoft_id:
                vals += [{
                    'name': event.name,
                    'microsoft_id': event.microsoft_id,
                    'start_datetime': event.start_datetime,
                    'stop_datetime': event.stop_datetime,
                    'active': False,
                    'need_sync_m': True,
                }]
                event._microsoft_delete(microsoft_service, event.microsoft_id)
                event.microsoft_id = False
        events |= self.env['calendar.event'].create(vals)
        events.need_sync_m = False
        return detached_events

    def _write_records(self, values, dtstart=None):
        # If only some events are updated, sync those events.
        # If all events are updated, sync the recurrence instead.
        if self.model == 'calendar.event':
            values['need_sync_m'] = bool(dtstart)
        return super()._write_records(values, dtstart=dtstart)

    def _get_rrule(self, dtstart=None, rrule_args=None):
        if not dtstart and self.dtstart:
            dtstart = self.dtstart
        return super()._get_rrule(dtstart, rrule_args)

    def _get_microsoft_synced_fields(self):
        return {'rrule'} | self.env['calendar.event']._get_microsoft_synced_fields()

    @api.model
    def _restart_microsoft_sync(self):
        self.env['recurrence.recurrence'].search(self._get_microsoft_sync_domain()).write({
            'need_sync_m': True,
        })

    def _write_from_microsoft(self, microsoft_event, vals):
        current_rrule = self.rrule
        # event_tz is written on event in Microsoft but on recurrence in Odoo
        vals['record_tz'] = microsoft_event.start.get('timeZone')
        super()._write_from_microsoft(microsoft_event, vals)
        base_event_time_fields = ['start_datetime', 'stop_datetime', 'allday']
        new_event_values = self.env["calendar.event"]._microsoft_to_odoo_values(microsoft_event)
        base_event = self.base_id and self.env["calendar.event"].browse(self.base_id).exists()
        old_event_values = base_event and base_event.read(base_event_time_fields)[0]
        if old_event_values and any(new_event_values[key] != old_event_values[key] for key in base_event_time_fields):
            # we need to recreate the recurrence, time_fields were modified.
            # We archive the old events to recompute the recurrence. These events are already deleted on Microsoft side.
            # We can't call _cancel because events without user_id would not be deleted
            events = self._get_recurrent_records(model='calendar.event')
            (events - base_event).microsoft_id = False
            (events - base_event).unlink()
            base_event.with_context(dont_notify=True).write(dict(new_event_values, microsoft_id=False, need_sync_m=False))
            if self.rrule == current_rrule:
                # if the rrule has changed, it will be recalculated below
                # There is no detached event now
                self.with_context(dont_notify=True)._apply_recurrence()
        else:
            time_fields = (
                    self.env["calendar.event"]._get_time_fields()
                    | self.env["calendar.event"]._get_recurrent_fields()
            )
            # We avoid to write time_fields because they are not shared between events.
            self._write_records(dict({
                field: value
                for field, value in new_event_values.items()
                if field not in time_fields
                }, need_sync_m=False)
            )
        # We apply the rrule check after the time_field check because the microsoft_id are generated according
        # to base_event start datetime.
        if self.rrule != current_rrule:
            detached_events = self._apply_recurrence(model='calendar.event')
            detached_events.microsoft_id = False
            detached_events.unlink()

    def _get_microsoft_sync_domain(self):
        # Empty rrule may exists in historical data. It is not a desired behavior but it could have been created with
        # older versions of the module. When synced, these recurrence may come back from Microsoft after database cleaning
        # and trigger errors as the records are not properly populated.
        # We also prevent sync of other user recurrent events.
        # arj todo note before it was like that. problems are coming: ...
        # fixme return [('calendar_event_ids.user_id', '=', self.env.user.id), ('rrule', '!=', False)]
        # Note for review: See the weird user_id computed field in google_calendar to see if it is a valid solution
        #
        return [('rrule', '!=', False), ('model', '=', 'calendar.event')]


    def _cancel_microsoft(self):
        events = self._get_recurrent_records(model='calendar.event')
        events._cancel_microsoft()
        super()._cancel_microsoft()

    @api.model
    def _microsoft_to_odoo_values(self, microsoft_recurrence, default_reminders=(), default_values={}):
        recurrence = microsoft_recurrence.get_recurrence()
        return {
            **recurrence,
            'model': 'calendar.event',
            'microsoft_id': microsoft_recurrence.id,
        }

    def _microsoft_values(self, fields_to_sync):
        events_outliers = self.calendar_event_ids.filtered(lambda e: not e.follow_recurrence)
        events = self.calendar_event_ids.sorted('start')
        normal_event = (events - events_outliers)[:1] or events[:1]
        if not normal_event:
            return {}
        values = normal_event._microsoft_values(fields_to_sync, initial_values={'type': 'seriesMaster'})

        if self.microsoft_id:
            values['id'] = self.microsoft_id
            if events_outliers:
                # We send the data as a list. If we directly send a list of values, we have issues...
                values = [values]
                for event in events_outliers:
                    event_value = event._microsoft_values(fields_to_sync)
                    values += [event_value]
        return values

    def _ensure_attendees_have_email(self):
        self.calendar_event_ids.filtered(lambda e: e.active)._ensure_attendees_have_email()
