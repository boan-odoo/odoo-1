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
            survey_sudo, answer_sudo = access_data['survey_sudo'], access_data['answer_sudo']
            # remove failed user inputs as we gonna archive membership if failed attempt is equal to attempt limit
            # so when user rejoin course then we unarchive the membership and survey do not have failed attempts
            survey_sudo._remove_all_failed_attempt_of_partner(answer_sudo.partner_id, answer_sudo.email, answer_sudo.invite_token)
        return result
