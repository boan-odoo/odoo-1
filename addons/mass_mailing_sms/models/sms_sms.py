# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import re
from itertools import groupby

from odoo import fields, models, tools


class SmsSms(models.Model):
    _inherit = ['sms.sms']

    mailing_id = fields.Many2one('mailing.mailing', string='Mass Mailing')
    mailing_trace_ids = fields.One2many('mailing.trace', 'sms_sms_id', string='Statistics')

    def _update_body_short_links(self):
        """ Override to tweak shortened URLs by adding statistics ids, allowing to
        find customer back once clicked. """
        res = dict.fromkeys(self.ids, False)
        for sms in self:
            if not sms.mailing_id or not sms.body:
                res[sms.id] = sms.body
                continue

            body = sms.body
            for url in re.findall(tools.TEXT_URL_REGEX, body):
                if url.startswith(sms.get_base_url() + '/r/'):
                    body = body.replace(url, url + '/s/%s' % sms.id)
            res[sms.id] = body
        return res

    def _postprocess_iap_sent_sms(self, iap_results, failure_reason=None, unlink_failed=False, unlink_sent=False):
        all_traces = self.env['mailing.trace'].sudo().search([
            ('sms_request_uuid', 'in', [result['request_uuid'] for result in iap_results]),
        ])
        if all_traces:
            key = lambda result: result['state']
            for state, results in groupby(sorted(iap_results, key=key), key=key):
                request_uuids = {r['request_uuid'] for r in results}
                traces = all_traces.filtered(lambda t: t.sms_request_uuid in request_uuids)
                if traces and state == 'success':
                    traces.set_sent()
                elif traces:
                    traces.set_failed(failure_type=self.IAP_TO_SMS_STATE[state])
        return super(SmsSms, self)._postprocess_iap_sent_sms(
            iap_results, failure_reason=failure_reason,
            unlink_failed=unlink_failed, unlink_sent=unlink_sent
        )
