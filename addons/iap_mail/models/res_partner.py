# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import json

from odoo import api, fields, models, tools
from odoo.addons.iap.tools import iap_tools


class ResPartner(models.Model):
    _inherit = 'res.partner'

    # enrich
    iap_enrich_info = fields.Text('IAP Enrich Info', help='IAP response stored as a JSON string',
                                  compute='_compute_partner_iap_info')
    iap_search_domain = fields.Char('Search Domain / Email',
                                compute='_compute_partner_iap_info')
    # autocomplete
    partner_gid = fields.Integer('Company database ID')

    def _compute_partner_iap_info(self):
        partner_iaps = self.env['res.partner.iap'].sudo().search([('partner_id', 'in', self.ids)])
        partner_iaps_per_partner = {
            partner_iap.partner_id: partner_iap
            for partner_iap in partner_iaps
        }

        for partner in self:
            partner_iap = partner_iaps_per_partner.get(partner)
            if partner_iap:
                partner.iap_enrich_info = partner_iap.iap_enrich_info
                partner.iap_search_domain = partner_iap.iap_search_domain
            else:
                partner.iap_enrich_info = False
                partner.iap_search_domain = False

    @api.model
    def create(self, vals):
        partner = super(ResPartner, self).create(vals)

        if vals.get('iap_enrich_info') or vals.get('iap_search_domain'):
            # Not done with inverse method so we do not need to search
            # for existing <res.partner.iap>
            self.env['res.partner.iap'].sudo().create({
                'partner_id': partner.id,
                'iap_enrich_info': vals.get('iap_enrich_info'),
                'iap_search_domain': vals.get('iap_search_domain'),
            })

        return partner

    def write(self, vals):
        super(ResPartner, self).write(vals)

        if 'iap_enrich_info' in vals or 'iap_search_domain' in vals:
            # Not done with inverse method so we do need to search
            # for existing <res.partner.iap> only once
            partner_iaps = self.env['res.partner.iap'].sudo().search([('partner_id', 'in', self.ids)])
            missing_partners = self
            for partner_iap in partner_iaps:
                if 'iap_enrich_info' in vals:
                    partner_iap.iap_enrich_info = vals['iap_enrich_info']
                if 'iap_search_domain' in vals:
                    partner_iap.iap_search_domain = vals['iap_search_domain']

                missing_partners -= partner_iap.partner_id

            if missing_partners:
                # Create new <res.partner.iap> for missing records
                self.env['res.partner.iap'].sudo().create([
                    {
                        'partner_id': partner.id,
                        'iap_enrich_info': vals.get('iap_enrich_info'),
                        'iap_search_domain': vals.get('iap_search_domain'),
                    } for partner in missing_partners
                ])

    # ------------------------------------------------------------
    # ENRICH
    # ------------------------------------------------------------

    def _iap_request_enrich_json(self, domain):
        enriched_data = {}
        try:
            # key does not matter, is returned as it
            response = self.env['iap.enrich.api']._request_enrich({domain: domain})
        except iap_tools.InsufficientCreditError:
            enriched_data['enrichment_info'] = {
                'type': 'insufficient_credit',
                'info': self.env['iap.account'].get_credits_url('reveal')
            }
        except Exception:
            enriched_data["enrichment_info"] = {
                'type': 'other',
                'info': 'Unknown reason'
            }
        else:
            enriched_data = response.get(domain)
            if not enriched_data:
                enriched_data = {
                    'enrichment_info': {
                        'type': 'no_data',
                        'info': 'The enrichment API found no data for the email provided.'
                    }
                }
        return enriched_data

    def _fetch_from_iap_enrich(self, email):
        iap_search_domain = self._get_iap_search_term(email)
        partner_iap = self.env["res.partner.iap"].sudo().search([("iap_search_domain", "=", iap_search_domain)], limit=1)
        if partner_iap:
            return partner_iap.partner_id, {}
        partner = self.env["res.partner"].search([("is_company", "=", True), ("email_normalized", "=ilike", "%" + iap_search_domain)], limit=1)
        if partner:
            return partner, {}

        return self._create_from_iap_enrich(email)

    def _create_from_iap_enrich(self, email):
        domain = tools.email_domain_extract(email)
        iap_payload = self._iap_request_enrich_json(domain)
        if 'enrichment_info' in iap_payload:
            return None, iap_payload['enrichment_info']

        contact_vals = self.env['iap.enrich.api']._get_contact_vals_from_response(iap_payload, include_logo=True)
        new_company_vals = dict(
            (field_name, contact_vals[field_name])
            for field_name in ['city', 'country_id', 'image_1920', 'name',
                               'phone', 'state_id', 'street', 'website', 'zip'
                              ]
        )
        new_company_vals['email'] = contact_vals['email_from']
        new_company_vals['iap_enrich_info'] = json.dumps(iap_payload)
        # use given email (not iap value) as this is the user request we want to store
        # to avoid duplicate searches
        new_company_vals['iap_search_domain'] = self._get_iap_search_term(email)
        new_company_vals['is_company'] = True

        new_company = self.env['res.partner'].create(new_company_vals)

        new_company.message_post_with_view(
            'iap_mail.enrich_company',
            values=iap_payload,
            subtype_id=self.env.ref('mail.mt_note').id,
        )

        return new_company, {'type': 'company_created'}

    def _update_from_iap_enrich(self):
        self.ensure_one()

        domain = tools.email_domain_extract(self.email)

        iap_payload = self._iap_request_enrich_json(domain)
        if 'enrichment_info' in iap_payload:
            return iap_payload['enrichment_info']

        contact_vals = self.env['iap.enrich.api']._get_contact_vals_from_response(iap_payload, include_logo=not self.image_128)
        partner_values = {}
        if not self.iap_enrich_info:
            partner_values.update({'iap_enrich_info': json.dumps(iap_payload)})
        if not self.image_128 and contact_vals.get('image_1920'):
            partner_values.update({'image_1920': contact_vals['image_1920']})
        if not self.phone and contact_vals.get('phone'):
            partner_values.update({'phone': contact_vals.get['phone']})

        # only update keys for which we dont have values yet
        partner_values.update(dict(
            (field_name, contact_vals[field_name])
            for field_name in ['city', 'street', 'website', 'zip']
            if not self[field_name] and contact_vals.get(field_name)
        ))
        self.write(partner_values)

        self.message_post_with_view(
            'iap_mail.enrich_company',
            values=iap_payload,
            subtype_id=self.env.ref('mail.mt_note').id,
        )

        return {}

    def _get_iap_search_term(self, email):
        """Return the domain or the email depending if the domain is blacklisted or not.

        So if the domain is blacklisted, we search based on the entire email address
        (e.g. asbl@gmail.com). But if the domain is not blacklisted, we search based on
        the domain (e.g. bob@sncb.be -> sncb.be)
        """
        domain = tools.email_domain_extract(email)
        return ("@" + domain) if domain not in iap_tools._MAIL_DOMAIN_BLACKLIST else email

    # ------------------------------------------------------------
    # AUTOCOMPLETE
    # ------------------------------------------------------------

    def _iap_perform_autocomplete(self, include_logo=True):
        self.ensure_one()
        company_domain = self._get_company_domain()
        if not company_domain:
            return False

        iap_payload, error = self.env['iap.autocomplete.api']._request_partner_autocomplete('enrich', {
            'domain': company_domain,
            'partner_gid': False,  # TDE: checkme
            'vat': self.vat,
        })
        if not iap_payload or error:
            return False

        contact_vals = self.env['iap.autocomplete.api']._get_contact_vals_from_response(iap_payload['company_data'], include_logo=include_logo)
        update_vals = dict(
            (fname, contact_vals[fname])
            for fname in contact_vals.keys()
            if not self[fname]
        )
        additional_data = update_vals.pop('additional_info', False)

        self.write(update_vals)
        if additional_data:
            template_values = json.loads(additional_data)
            template_values['flavor_text'] = _("Company auto-completed by Odoo Partner Autocomplete Service")
            self.message_post_with_view(
                'iap_mail.enrich_company',
                values=template_values,
                subtype_id=self.env.ref('mail.mt_note').id,
            )
        return True

    def _get_company_domain(self):
        """ Extract the company domain to be used by IAP services.
        The domain is extracted from the website or the email information.
        e.g:
            - www.info.proximus.be -> proximus.be
            - info@proximus.be -> proximus.be """
        self.ensure_one()

        company_domain = tools.email_domain_extract(self.email) if self.email else False
        if company_domain and company_domain not in iap_tools._MAIL_DOMAIN_BLACKLIST:
            return company_domain

        company_domain = tools.url_domain_extract(self.website) if self.website else False
        if not company_domain or company_domain in ['localhost', 'example.com']:
            return False

        return company_domain
