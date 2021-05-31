# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import base64

import werkzeug

from odoo import _, exceptions, http, tools
from odoo.http import request
from odoo.tools import consteq, html_escape
from werkzeug.exceptions import BadRequest


class MassMailController(http.Controller):

    def _valid_unsubscribe_token(self, mailing_id, res_id, email, token):
        if not (mailing_id and res_id and email and token):
            return False
        mailing = request.env['mailing.mailing'].sudo().browse(mailing_id)
        return consteq(mailing._unsubscribe_token(res_id, email), token)

    def _is_authorized(self, mailing_id, res_id, email, token):
        return request.session.uid or self._valid_unsubscribe_token(mailing_id, res_id, email, token)

    def _log_blacklist_action(self, blacklist_entry, mailing_id, description):
        mailing = request.env['mailing.mailing'].sudo().browse(mailing_id)
        model_display = mailing.mailing_model_id.display_name
        blacklist_entry._message_log(body=description + " ({})".format(model_display))

    @http.route(['/unsubscribe_from_list'], type='http', website=True, multilang=False, auth='public', sitemap=False)
    def unsubscribe_placeholder_link(self, **post):
        """Dummy route so placeholder is not prefixed by language, MUST have multilang=False"""
        raise werkzeug.exceptions.NotFound()

    @http.route(['/mail/mailing/<int:mailing_id>/unsubscribe'], type='http', website=True, auth='public')
    def mailing(self, mailing_id, email=None, res_id=None, token="", **post):
        mailing = request.env['mailing.mailing'].sudo().browse(mailing_id)
        if mailing.exists():
            res_id = res_id and int(res_id)
            if not self._is_authorized(mailing_id, res_id, email, str(token)):
                raise exceptions.AccessDenied()

            if mailing.mailing_model_real == 'mailing.contact':
                # Unsubscribe directly + Let the user choose his subscriptions
                mailing.update_opt_out(email, mailing.contact_list_ids.ids, True)

                contacts = request.env['mailing.contact'].sudo().search([('email_normalized', '=', tools.email_normalize(email))])
                subscription_list_ids = contacts.mapped('subscription_list_ids')
                # In many user are found : if user is opt_out on the list with contact_id 1 but not with contact_id 2,
                # assume that the user is not opt_out on both
                # TODO DBE Fixme : Optimise the following to get real opt_out and opt_in
                opt_out_list_ids = subscription_list_ids.filtered(lambda rel: rel.opt_out).mapped('list_id')
                opt_in_list_ids = subscription_list_ids.filtered(lambda rel: not rel.opt_out).mapped('list_id')
                opt_out_list_ids = set([list.id for list in opt_out_list_ids if list not in opt_in_list_ids])
                opt_out_reasons = request.env['mailing.contact.subscription']._fields['opt_out_reason'].selection

                unique_list_ids = set([list.list_id.id for list in subscription_list_ids])
                list_ids = request.env['mailing.list'].sudo().browse(unique_list_ids)
                unsubscribed_list = ', '.join(str(list.name) for list in mailing.contact_list_ids if list.is_public)
                return request.render('mass_mailing.page_unsubscribe', {
                    'contacts': contacts,
                    'list_ids': list_ids,
                    'opt_out_list_ids': opt_out_list_ids,
                    'opt_out_reasons': opt_out_reasons,
                    'unsubscribed_list': unsubscribed_list,
                    'email': email,
                    'mailing_id': mailing_id,
                    'res_id': res_id,
                    'show_blacklist_button': request.env['ir.config_parameter'].sudo().get_param('mass_mailing.show_blacklist_buttons'),
                    'has_public_list': len(list_ids.filtered(lambda list: list.is_public)) > 0,
                })
            else:
                opt_in_lists = request.env['mailing.contact.subscription'].sudo().search([
                    ('contact_id.email_normalized', '=', email),
                    ('opt_out', '=', False)
                ]).mapped('list_id')
                blacklist_rec = request.env['mail.blacklist'].sudo()._add(email)
                self._log_blacklist_action(
                    blacklist_rec, mailing_id,
                    _("""Requested blacklisting via unsubscribe link."""))
                return request.render('mass_mailing.page_unsubscribed', {
                    'email': email,
                    'mailing_id': mailing_id,
                    'res_id': res_id,
                    'list_ids': opt_in_lists,
                    'show_blacklist_button': request.env['ir.config_parameter'].sudo().get_param(
                        'mass_mailing.show_blacklist_buttons'),
                })
        return request.redirect('/web')

    @http.route('/mail/mailing/unsubscribe', type='json', auth='public')
    def unsubscribe(self, mailing_id, opt_in_ids, opt_out_ids, email, res_id, token):
        mailing = request.env['mailing.mailing'].sudo().browse(mailing_id)
        if mailing.exists():
            if not self._is_authorized(mailing_id, res_id, email, token):
                return 'unauthorized'
            mailing.update_opt_out(email, opt_in_ids, False)
            mailing.update_opt_out(email, opt_out_ids, True)
            return True
        return 'error'

    @http.route(['/mailing/unsubscribe'], type='http', website=True, auth='public', sitemap=False)
    def mailing_list_unsubscribe(self):
        if not request.session.uid:
            return exceptions.AccessDenied()
        if 'mailing_id' in request.params:
            if request.params['mailing_id'].isdigit():
                return self.mailing(int(request.params['mailing_id']), email=request.env.user.email)
        return request.render('mass_mailing.page_subscription', {
            'list_ids': request.env['mailing.contact.subscription'].sudo().search([
                ('contact_id.email_normalized', '=', request.env.user.email),
                ('opt_out', '=', False)
            ]).mapped('list_id')
        })

    @http.route('/mail/track/<int:mail_id>/<string:token>/blank.gif', type='http', auth='public')
    def track_mail_open(self, mail_id, token, **post):
        """ Email tracking. """
        if not consteq(token, tools.hmac(request.env(su=True), 'mass_mailing-mail_mail-open', mail_id)):
            raise BadRequest()

        request.env['mailing.trace'].sudo().set_opened(mail_mail_ids=[mail_id])
        response = werkzeug.wrappers.Response()
        response.mimetype = 'image/gif'
        response.data = base64.b64decode(b'R0lGODlhAQABAIAAANvf7wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==')

        return response

    @http.route(['/mailing/<int:mailing_id>/view'], type='http', website=True, auth='public')
    def view(self, mailing_id, email=None, res_id=None, token=""):
        mailing = request.env['mailing.mailing'].sudo().browse(mailing_id)
        if mailing.exists():
            res_id = int(res_id) if res_id else False
            if not self._is_authorized(mailing_id, res_id, email, str(token)) and not request.env.user.has_group('mass_mailing.group_mass_mailing_user'):
                raise exceptions.AccessDenied()

            res = mailing.convert_links()
            base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url').rstrip('/')
            urls_to_replace = [
               (base_url + '/unsubscribe_from_list', mailing._get_unsubscribe_url(email, res_id)),
               (base_url + '/view', mailing._get_view_url(email, res_id))
            ]
            for url_to_replace, new_url in urls_to_replace:
                if url_to_replace in res[mailing_id]:
                    res[mailing_id] = res[mailing_id].replace(url_to_replace, new_url if new_url else '#')

            res[mailing_id] = res[mailing_id].replace(
                'class="o_snippet_view_in_browser"',
                'class="o_snippet_view_in_browser" style="display: none;"'
            )

            return request.render('mass_mailing.view', {
                    'body': res[mailing_id],
                })

        return request.redirect('/web')

    @http.route('/r/<string:code>/m/<int:mailing_trace_id>', type='http', auth="public")
    def full_url_redirect(self, code, mailing_trace_id, **post):
        # don't assume geoip is set, it is part of the website module
        # which mass_mailing doesn't depend on
        country_code = request.session.get('geoip', False) and request.session.geoip.get('country_code', False)

        request.env['link.tracker.click'].sudo().add_click(
            code,
            ip=request.httprequest.remote_addr,
            country_code=country_code,
            mailing_trace_id=mailing_trace_id
        )
        return werkzeug.utils.redirect(request.env['link.tracker'].get_url_from_code(code), 301)

    @http.route('/mailing/blacklist/check', type='json', auth='public')
    def blacklist_check(self, mailing_id, res_id, email, token):
        if not self._is_authorized(mailing_id, res_id, email, token):
            return 'unauthorized'
        if email:
            record = request.env['mail.blacklist'].sudo().with_context(active_test=False).search([('email', '=', tools.email_normalize(email))])
            if record['active']:
                return True
            return False
        return 'error'

    @http.route('/mailing/blacklist/add', type='json', auth='public')
    def blacklist_add(self, mailing_id, res_id, email, token):
        if not self._is_authorized(mailing_id, res_id, email, token):
            return 'unauthorized'
        if email:
            blacklist_rec = request.env['mail.blacklist'].sudo()._add(email)
            self._log_blacklist_action(
                blacklist_rec, mailing_id,
                _("""Requested blacklisting via unsubscription page."""))
            return True
        return 'error'

    @http.route('/mailing/blacklist/remove', type='json', auth='public')
    def blacklist_remove(self, mailing_id, res_id, email, token):
        if not self._is_authorized(mailing_id, res_id, email, token):
            return 'unauthorized'
        if email:
            blacklist_rec = request.env['mail.blacklist'].sudo()._remove(email)
            self._log_blacklist_action(
                blacklist_rec, mailing_id,
                _("""Requested de-blacklisting via unsubscription page."""))
            return True
        return 'error'

    @http.route('/mailing/feedback', type='json', auth='public')
    def send_feedback(self, mailing_id, res_id, email, feedback, token):
        mailing = request.env['mailing.mailing'].sudo().browse(mailing_id)
        if not mailing.exists() or not email:
            return 'error'
        if not self._is_authorized(mailing_id, res_id, email, token):
            return 'unauthorized'

        options = dict(request.env['mailing.contact.subscription']._fields['opt_out_reason']._description_selection(request.env))
        if 'key' not in feedback or feedback['key'] not in options:
            feedback['key'] = 'other'

        model = request.env[mailing.mailing_model_real]
        records = model.sudo().search([('email_normalized', '=', tools.email_normalize(email))])
        subscription_ids = records.mapped('subscription_list_ids').filtered(
            lambda x: x.opt_out and x.list_id.id in mailing.contact_list_ids.ids
        )
        subscription_ids.write({'opt_out_reason': feedback.get('key')})
        for subscription in subscription_ids:
            contact = subscription.contact_id
            try:
                contact.check_access_rights('write')
                contact.check_access_rule('write')
            except exceptions.AccessError:
                contact = contact.sudo()
            if feedback.get('key') == 'other':
                contact.message_post(body=_('Feedback from %s: %s (other)') % (email, html_escape(feedback.get('reason'))))
            else:
                contact.message_post(body=_('Feedback from %s: %s') % (email, html_escape(options.get(feedback.get('key')))))
        return True
