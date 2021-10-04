# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import http
from odoo.osv import expression
from odoo.addons.survey.controllers import main
from odoo.http import request


class Survey(main.Survey):
    def _prepare_survey_finished_values(self, survey, answer, token=False):
        result = super(Survey, self)._prepare_survey_finished_values(survey, answer, token)
        if answer.slide_id:
            result['channel_id'] = answer.slide_id.channel_id

        return result

    def _prepare_retry_additional_values(self, answer):
        result = super(Survey, self)._prepare_retry_additional_values(answer)
        if answer.slide_id:
            result['slide_id'] = answer.slide_id.id
        if answer.slide_partner_id:
            result['slide_partner_id'] = answer.slide_partner_id.id

        return result

    @http.route('/survey/submit/<string:survey_token>/<string:answer_token>', type='json', auth='public', website=True)
    def survey_submit(self, survey_token, answer_token, **post):
        result = super(Survey, self).survey_submit(survey_token, answer_token, **post)
        access_data = self._get_access_data(survey_token, answer_token, ensure_token=True)
        if not result.get('error'):
            answer_sudo = access_data['answer_sudo']
            user_inputs_attempts = answer_sudo.get_failed_attempts()
            for user_input in user_inputs_attempts:
                domain = [
                    ('survey_id', '=', user_input.survey_id.id),
                    ('test_entry', '=', False),
                    ('state', '=', 'done')
                ]

                if user_input.partner_id:
                    domain = expression.AND([domain, [('partner_id', '=', user_input.partner_id.id)]])
                else:
                    domain = expression.AND([domain, [('email', '=', user_input.email)]])

                if user_input.invite_token:
                    domain = expression.AND([domain, [('invite_token', '=', user_input.invite_token)]])
                # remove failed user inputs as we gonna archive membership if failed attempt is equal to attempt limit
                # so when user rejoin course then we unarchive the membership and survey do not have failed attempts
                request.env['survey.user_input'].sudo().search(domain).unlink()
        return result
