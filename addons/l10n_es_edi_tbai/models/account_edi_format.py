# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import math
from base64 import b64encode
from collections import defaultdict
from datetime import datetime
from functools import partial
from re import sub as regex_sub
from uuid import uuid4

from odoo.addons.l10n_es_edi_tbai.models.web_services import TicketBaiWebServices
from odoo.addons.l10n_es_edi_tbai.models.xml_utils import L10nEsTbaiXmlUtils
from cryptography.hazmat.primitives import hashes, serialization
from lxml import etree
from odoo import _, models
from odoo.exceptions import UserError
from odoo.tools.float_utils import float_repr
from pytz import timezone
from requests.exceptions import RequestException

from .res_company import L10N_ES_EDI_TBAI_VERSION


class AccountEdiFormat(models.Model):
    _inherit = 'account.edi.format'

    # -------------------------------------------------------------------------
    # EDI OVERRIDDEN METHODS
    # -------------------------------------------------------------------------

    def _is_required_for_invoice(self, invoice):
        # OVERRIDE
        if self.code != 'es_tbai':
            return super()._is_required_for_invoice(invoice)

        # TODO for Bizkaia, move_type in ('in_invoice', 'in_refund') also yields True
        return invoice.l10n_es_tbai_is_required and invoice.move_type in ('out_invoice', 'out_refund')

    def _needs_web_services(self):
        # OVERRIDE
        return self.code == 'es_tbai' or super()._needs_web_services()

    def _is_compatible_with_journal(self, journal):
        # OVERRIDE
        # TODO inherit from account_edi_format (SII) and disable SII when TicketBai enabled ? (@Jos)
        if self.code != 'es_tbai':
            return super()._is_compatible_with_journal(journal)

        return journal.country_code == 'ES'

    def _get_invoice_edi_content(self, invoice):
        # OVERRIDE
        if self.code != 'es_tbai':
            return super()._get_invoice_edi_content(invoice)
        return self._l10n_es_tbai_get_invoice_xml(invoice)

    def _check_configuration_is_complete(self, invoice):
        # Ensure a certificate is available.
        certificate = invoice.company_id.l10n_es_tbai_certificate_id
        if not certificate:
            return {
                'error': _("Please configure the certificate for TicketBAI."),
                'blocking_level': 'error',
            }

        # Ensure a tax agency is available.
        tax_agency = invoice.company_id.mapped('l10n_es_tbai_tax_agency')[0]
        if not tax_agency:
            return {
                'error': _("Please specify a tax agency on your company for TicketBAI."),
                'blocking_level': 'error',
                'success': False
            }

        return None

    def _post_invoice_edi(self, invoice):
        # OVERRIDE
        if self.code != 'es_tbai':
            return super()._post_invoice_edi(invoice)

        # Configuration check
        error_dict = self._check_configuration_is_complete(invoice)
        if error_dict is not None:
            return {inv: error_dict
                    for inv in invoice}

        # Generate the XML values.
        inv_xml = self._l10n_es_tbai_get_invoice_xml(invoice)

        # Optional check using the XSD
        xsd_id = f'l10n_es_edi_tbai.{invoice.company_id.l10n_es_tbai_tax_agency}_ticketBaiV1-2.xsd'
        res = {invoice: self._l10n_es_tbai_verify_xml(inv_xml, xsd_id)}
        if 'error' in res[invoice]:
            return res

        # Call the web service and get response
        res.update(self._l10n_es_tbai_post_to_web_service(invoice, inv_xml))
        response_xml = res[invoice]['response']

        # TIMEOUT / NO RESPONSE: success is undetermined
        if response_xml is None:
            pass

        # SUCCESS
        elif res[invoice].get('success'):
            # Attachment: post to chatter and save as EDI document
            invoice.with_context(no_new_invoice=True).message_post(
                body="<pre>TicketBAI: posted XML\n" + res[invoice]['message'] + "</pre>",
                attachment_ids=invoice.l10n_es_tbai_post_xml.ids)
            res[invoice]['attachment'] = invoice.l10n_es_tbai_post_xml

        # FAILURE
        else:
            invoice._update_l10n_es_tbai_submitted_xml(xml_doc=None, cancel=False)

        return res

    def _cancel_invoice_edi(self, invoice):
        # OVERRIDE
        if self.code != 'es_tbai':
            return super()._post_invoice_edi(invoice)

        # Configuration check
        error_dict = self._check_configuration_is_complete(invoice)
        if error_dict is not None:
            return {inv: error_dict
                    for inv in invoice}

        # Generate the XML values.
        cancel_xml = self._l10n_es_tbai_get_invoice_xml(invoice, cancel=True)

        # Optional check using the XSD
        xsd_id = f'l10n_es_edi_tbai.{invoice.company_id.l10n_es_tbai_tax_agency}_Anula_ticketBaiV1-2.xsd'
        res = {invoice: self._l10n_es_tbai_verify_xml(cancel_xml, xsd_id)}
        if 'error' in res[invoice]:
            return res

        # Call the web service and get response
        res.update(self._l10n_es_tbai_post_to_web_service(invoice, cancel_xml, cancel=True))
        response_xml = res[invoice]['response']

        # TIMEOUT / NO RESPONSE: success is undetermined
        if response_xml is None:
            pass

        # SUCCESS
        elif res[invoice].get('success'):
            # Put attachment in chatter
            invoice.with_context(no_new_invoice=True).message_post(
                body="<pre>TicketBAI: posted cancelation XML\n" + res[invoice]['message'] + "</pre>",
                attachment_ids=invoice.l10n_es_tbai_cancel_xml.ids)

        # FAILURE
        else:
            invoice._update_l10n_es_tbai_submitted_xml(xml_doc=None, cancel=True)  # will need to be re-created

        return res

    # -------------------------------------------------------------------------
    # TBAI XML VERIFY
    # -------------------------------------------------------------------------

    def _l10n_es_tbai_verify_xml(self, xml, xsd_id):
        xsd_attachment = self.env.ref(xsd_id, False)
        if xsd_attachment:
            try:
                L10nEsTbaiXmlUtils._validate_format_xsd(xml, xsd_id)
            except UserError as e:
                return {
                    'error': str(e).split('\\n'),
                    'blocking_level': 'error',
                    'success': False,
                }
        return {}

    # -------------------------------------------------------------------------
    # TBAI XML BUILD
    # -------------------------------------------------------------------------

    def _l10n_es_tbai_get_invoice_xml(self, invoice, cancel=False):
        # If peviously generated XML was posted and not rejected (success or timeout), reuse it
        doc = invoice._get_l10n_es_tbai_submitted_xml(cancel)
        if doc is not None:
            return doc

        # Otherwise, generate a new XML
        values = {
            'is_emission': not cancel,
            'datetime_now': datetime.now(tz=timezone('Europe/Madrid')),
            'datetime_strftime': datetime.strftime,
            'timezone_eus': timezone,
            'float_repr': partial(float_repr, precision_digits=2),
        }
        values.update(self._l10n_es_tbai_get_header_values(invoice))
        values.update(self._l10n_es_tbai_get_subject_values(invoice, cancel))
        values.update(self._l10n_es_tbai_get_invoice_values(invoice, cancel))
        values.update(self._l10n_es_tbai_get_trail_values(invoice, cancel))
        template_name = 'l10n_es_edi_tbai.template_invoice_main' + ('_cancel' if cancel else '_post')
        xml_str = self.env.ref(template_name)._render(values)
        xml_doc = L10nEsTbaiXmlUtils._cleanup_xml_content(xml_str, is_string=True)
        self._l10n_es_tbai_sign_invoice(invoice, xml_doc)

        # Store the XML as attachment to ensure it is never lost (even in case of timeout error)
        invoice._update_l10n_es_tbai_submitted_xml(xml_doc=xml_doc, cancel=cancel)

        return xml_doc

    def _l10n_es_tbai_get_header_values(self, invoice):
        return {
            'tbai_version': L10N_ES_EDI_TBAI_VERSION
        }

    def _l10n_es_tbai_get_subject_values(self, invoice, cancel):
        # === SENDER (EMISOR) ===
        sender = invoice.company_id if invoice.is_sale_document() else invoice.commercial_partner_id
        values = {
            'sender_vat': sender.vat[2:] if sender.vat.startswith('ES') else sender.vat,
            'sender': sender,
        }
        if cancel:
            return values

        # === RECIPIENTS (DESTINATARIOS) ===
        xml_recipients = []
        # TicketBAI accepts up to 100 recipients (but Odoo only supports one)
        for dest in (1,):
            eu_country_codes = set(self.env.ref('base.europe').country_ids.mapped('code'))
            partner = invoice.commercial_partner_id if invoice.is_sale_document() else invoice.company_id

            nif = False
            alt_id_country = False
            alt_id_number = partner.vat or 'NO_DISPONIBLE'
            alt_id_type = ""
            if partner == self.env.ref("l10n_es_edi_tbai.partner_simplified"):
                # Simplified partner (TODO check id_type and id_country are legal in this case)
                alt_id_country = 'ES'
                alt_id_type = '03'
            elif (not partner.country_id or partner.country_id.code == 'ES') and partner.vat:
                # ES partner with VAT.
                nif = partner.vat[2:] if partner.vat.startswith('ES') else partner.vat
            elif partner.country_id.code in eu_country_codes:
                # European partner
                alt_id_type = '02'
            else:
                # Non-european partner
                if partner.vat:
                    alt_id_type = '04'
                else:
                    alt_id_type = '06'
                if partner.country_id:
                    alt_id_country = partner.country_id.code

            values_dest = {
                'nif': nif,
                'alt_id_country': alt_id_country,
                'alt_id_number': alt_id_number,
                'alt_id_type': alt_id_type,
                'partner': partner,
                'partner_address': ', '.join(filter(lambda x: x, [partner.street, partner.street2, partner.city])),
            }
            xml_recipients.append(values_dest)

        values.update({
            'recipients': xml_recipients,
            # TODO for Bizkaia, option below can be "T" (if "in" invoice)
            'thirdparty_or_recipient': "D",  # thirdparty = Tercero, recipient = Destinatario
        })
        return values

    def _l10n_es_tbai_get_invoice_values(self, invoice, cancel):
        eu_country_codes = set(self.env.ref('base.europe').country_ids.mapped('code'))

        # === HEADER (CABECERA) ===
        values = {'invoice': invoice}
        if cancel:
            return values

        # === CREDIT NOTE (RECTIFICATIVA) ===
        is_refund = invoice.move_type == 'out_refund'  # TODO also in_refund (for Bizkaia)
        values['is_refund'] = is_refund
        is_simplified = invoice.partner_id == self.env.ref("l10n_es_edi_tbai.partner_simplified")
        if is_refund:
            # TODO check refund codes are legal before sending ? Do not use "defaults" here, show them in wizard
            values['credit_note_code'] = invoice.l10n_es_tbai_refund_reason or ('R5' if is_simplified else 'R1')
            values['credit_note_invoices'] = [  # uses a list because TicketBai supports issuing multiple credit notes
                invoice.reversed_entry_id
            ]
        else:
            values['is_simplified'] = is_simplified  # TODO may not apply to in_invoice (for Bizkaia)

        # === LINES (DETALLES) ===
        values['invoice_lines'] = [{
            'line': line,
            'address': regex_sub(r'[^0-9a-zA-Z ]', '', line.name)[:250],
        } for line in invoice.invoice_line_ids.filtered(lambda line: not line.display_type)]

        # CODES (CLAVES): TODO there's 15 more codes to implement, also there can be up to 3 in total
        # See https://www.gipuzkoa.eus/documents/2456431/13761128/Anexo+I.pdf/2ab0116c-25b4-f16a-440e-c299952d683d
        com_partner = invoice.commercial_partner_id
        if not com_partner.country_id or com_partner.country_id.code in eu_country_codes:
            values['vat_regime_code'] = '01'
        else:
            values['vat_regime_code'] = '02'

        # === BREAKDOWN TYPE (TIPO DESGLOSE) ===
        if com_partner.country_id.code in ('ES', False) and not (com_partner.vat or '').startswith("ESN"):
            tax_details_info_vals = self._l10n_es_tbai_get_invoice_tax_details_values(invoice)
            values['invoice_breakdown'] = tax_details_info_vals['tax_details_info']
            values['invoice_total'] = round(-1 * (tax_details_info_vals['tax_details']['base_amount']
                                                  + tax_details_info_vals['tax_details']['tax_amount']
                                                  - tax_details_info_vals['tax_amount_retention']), 2)

        else:
            tax_details_info_service_vals = self._l10n_es_tbai_get_invoice_tax_details_values(
                invoice,
                filter_invl_to_apply=lambda x: any(t.tax_scope == 'service' for t in x.tax_ids)
            )
            tax_details_info_consu_vals = self._l10n_es_tbai_get_invoice_tax_details_values(
                invoice,
                filter_invl_to_apply=lambda x: any(t.tax_scope == 'consu' for t in x.tax_ids)
            )

            if tax_details_info_service_vals['tax_details_info']:
                values['services_provision'] = tax_details_info_service_vals['tax_details_info']
            if tax_details_info_consu_vals['tax_details_info']:
                values['goods_delivery'] = tax_details_info_consu_vals['tax_details_info']

            values['invoice_total'] = round(-1 * (
                tax_details_info_service_vals['tax_details']['base_amount']
                + tax_details_info_service_vals['tax_details']['tax_amount']
                - tax_details_info_service_vals['tax_amount_retention']
                + tax_details_info_consu_vals['tax_details']['base_amount']
                + tax_details_info_consu_vals['tax_details']['tax_amount']
                - tax_details_info_consu_vals['tax_amount_retention']), 2)

        return values

    def _l10n_es_tbai_get_invoice_tax_details_values(self, invoice, filter_invl_to_apply=None):
        # Copied (and slightly adapted) from l10n_es_edi_sii module

        def grouping_key_generator(tax_values):
            tax = tax_values['tax_id']
            return {
                'applied_tax_amount': tax.amount,
                'l10n_es_type': tax.l10n_es_type,
                'l10n_es_exempt_reason': tax.l10n_es_exempt_reason if tax.l10n_es_type == 'exento' else False,
                'l10n_es_bien_inversion': tax.l10n_es_bien_inversion,
            }

        def filter_to_apply(tax_values):
            # For intra-community, we do not take into account the negative repartition line
            return tax_values['tax_repartition_line_id'].factor_percent > 0.0

        def full_filter_invl_to_apply(invoice_line):
            if 'ignore' in invoice_line.tax_ids.flatten_taxes_hierarchy().mapped('l10n_es_type'):
                return False
            return filter_invl_to_apply(invoice_line) if filter_invl_to_apply else True

        tax_details = invoice._prepare_edi_tax_details(
            grouping_key_generator=grouping_key_generator,
            filter_invl_to_apply=full_filter_invl_to_apply,
            filter_to_apply=filter_to_apply,
        )
        sign = -1 if invoice.is_sale_document() else 1

        tax_details_info = defaultdict(dict)

        # Detect for which is the main tax for 'recargo'. Since only a single combination tax + recargo is allowed
        # on the same invoice, this can be deduced globally.

        recargo_tax_details = {}  # Mapping between main tax and recargo tax details
        invoice_lines = invoice.invoice_line_ids.filtered(lambda x: not x.display_type)
        if filter_invl_to_apply:
            invoice_lines = invoice_lines.filtered(filter_invl_to_apply)
        for line in invoice_lines:
            taxes = line.tax_ids.flatten_taxes_hierarchy()
            recargo_tax = [t for t in taxes if t.l10n_es_type == 'recargo']
            if recargo_tax and taxes:
                recargo_main_tax = taxes.filtered(lambda x: x.l10n_es_type in ('sujeto', 'sujeto_isp'))[:1]
                if not recargo_tax_details.get(recargo_main_tax):
                    recargo_tax_details[recargo_main_tax] = [
                        x for x in tax_details['tax_details'].values()
                        if x['group_tax_details'][0]['tax_id'] == recargo_tax[0]
                    ][0]

        tax_amount_deductible = 0.0
        tax_amount_retention = 0.0
        base_amount_not_subject = 0.0
        base_amount_not_subject_loc = 0.0
        tax_subject_info_list = []
        tax_subject_isp_info_list = []
        for tax_values in tax_details['tax_details'].values():

            if tax_values['l10n_es_type'] in ('sujeto', 'sujeto_isp'):
                tax_amount_deductible += tax_values['tax_amount']

                base_amount = sign * tax_values['base_amount']
                tax_info = {
                    'TipoImpositivo': tax_values['applied_tax_amount'],
                    'BaseImponible': round(base_amount, 2),
                    'CuotaRepercutida': round(math.copysign(tax_values['tax_amount'], base_amount), 2),
                }

                recargo = recargo_tax_details.get(tax_values['group_tax_details'][0]['tax_id'])
                if recargo:
                    tax_info['CuotaRecargoEquivalencia'] = round(sign * recargo['tax_amount'], 2)
                    tax_info['TipoRecargoEquivalencia'] = recargo['applied_tax_amount']

                if tax_values['l10n_es_type'] == 'sujeto':
                    tax_subject_info_list.append(tax_info)
                else:
                    tax_subject_isp_info_list.append(tax_info)

            elif tax_values['l10n_es_type'] == 'exento':
                tax_details_info['Sujeta'].setdefault('Exenta', {'DetalleExenta': []})
                tax_details_info['Sujeta']['Exenta']['DetalleExenta'].append({
                    'BaseImponible': round(sign * tax_values['base_amount'], 2),
                    'CausaExencion': tax_values['l10n_es_exempt_reason'],
                })
            elif tax_values['l10n_es_type'] == 'retencion':
                tax_amount_retention += tax_values['tax_amount']
            elif tax_values['l10n_es_type'] == 'no_sujeto':
                base_amount_not_subject += tax_values['base_amount']
            elif tax_values['l10n_es_type'] == 'no_sujeto_loc':
                base_amount_not_subject_loc += tax_values['base_amount']
            elif tax_values['l10n_es_type'] == 'ignore':
                continue

            if tax_subject_isp_info_list and not tax_subject_info_list:
                tax_details_info['Sujeta']['NoExenta'] = {'TipoNoExenta': 'S2'}
            elif not tax_subject_isp_info_list and tax_subject_info_list:
                tax_details_info['Sujeta']['NoExenta'] = {'TipoNoExenta': 'S1'}
            elif tax_subject_isp_info_list and tax_subject_info_list:
                tax_details_info['Sujeta']['NoExenta'] = {'TipoNoExenta': 'S3'}

            if tax_subject_info_list:
                tax_details_info['Sujeta']['NoExenta'].setdefault('DesgloseIVA', {})
                tax_details_info['Sujeta']['NoExenta']['DesgloseIVA'].setdefault('DetalleIVA', [])
                tax_details_info['Sujeta']['NoExenta']['DesgloseIVA']['DetalleIVA'] += tax_subject_info_list
            if tax_subject_isp_info_list:
                tax_details_info['Sujeta']['NoExenta'].setdefault('DesgloseIVA', {})
                tax_details_info['Sujeta']['NoExenta']['DesgloseIVA'].setdefault('DetalleIVA', [])
                tax_details_info['Sujeta']['NoExenta']['DesgloseIVA']['DetalleIVA'] += tax_subject_isp_info_list

        if not invoice.company_id.currency_id.is_zero(base_amount_not_subject) and invoice.is_sale_document():
            tax_details_info['NoSujeta']['ImportePorArticulos7_14_Otros'] = round(sign * base_amount_not_subject, 2)
        if not invoice.company_id.currency_id.is_zero(base_amount_not_subject_loc) and invoice.is_sale_document():
            tax_details_info['NoSujeta']['ImporteTAIReglasLocalizacion'] = round(sign * base_amount_not_subject_loc, 2)

        return {
            'tax_details_info': tax_details_info,
            'tax_details': tax_details,
            'tax_amount_deductible': tax_amount_deductible,
            'tax_amount_retention': tax_amount_retention,
            'base_amount_not_subject': base_amount_not_subject,
        }

    def _l10n_es_tbai_get_trail_values(self, invoice, cancel):
        prev_invoice = invoice.company_id.get_l10n_es_tbai_last_posted_id()
        if prev_invoice and not cancel:
            return {
                'chain_prev_invoice': prev_invoice
            }
        else:
            return {}

    def _l10n_es_tbai_sign_invoice(self, invoice, xml_root):
        company = invoice.company_id
        cert_private, cert_public = company.l10n_es_tbai_certificate_id._get_key_pair()
        public_key = cert_public.public_key()

        # Identifiers
        doc_id = "id-" + str(uuid4())
        signature_id = "sig-" + doc_id
        kinfo_id = "ki-" + doc_id
        sp_id = "sp-" + doc_id

        # Render digital signature scaffold from QWeb
        values = {
            'dsig': {
                'document_id': doc_id,
                'x509_certificate': L10nEsTbaiXmlUtils._base64_print(b64encode(cert_public.public_bytes(encoding=serialization.Encoding.DER))),
                'public_modulus': L10nEsTbaiXmlUtils._base64_print(b64encode(L10nEsTbaiXmlUtils._long_to_bytes(public_key.public_numbers().n))),
                'public_exponent': L10nEsTbaiXmlUtils._base64_print(b64encode(L10nEsTbaiXmlUtils._long_to_bytes(public_key.public_numbers().e))),
                'iso_now': datetime.now().isoformat(),
                'keyinfo_id': kinfo_id,
                'signature_id': signature_id,
                'sigpolicy_id': sp_id,
                'sigpolicy_description': "Política de Firma TicketBAI 1.0",  # í = &#237;
                'sigpolicy_url': company.get_l10n_es_tbai_url_sigpolicy(),
                'sigpolicy_digest': company.get_l10n_es_tbai_url_sigpolicy(get_hash=True),
                'sigcertif_digest': b64encode(cert_public.fingerprint(hashes.SHA256())).decode(),
            }
        }
        xml_sig_str = self.env.ref('l10n_es_edi_tbai.template_digital_signature')._render(values)
        xml_sig = L10nEsTbaiXmlUtils._cleanup_xml_content(xml_sig_str, is_string=True, indent_level=1)

        # Complete document with signature template
        xml_root[-1].tail = "\n  "
        xml_root.append(xml_sig)

        # Compute digest values for references
        L10nEsTbaiXmlUtils._reference_digests(xml_sig.find("ds:SignedInfo", namespaces=L10nEsTbaiXmlUtils.NS_MAP))

        # Sign (writes into SignatureValue)
        L10nEsTbaiXmlUtils._fill_signature(xml_sig, cert_private)
        signature_value = xml_sig.find("ds:SignatureValue", namespaces=L10nEsTbaiXmlUtils.NS_MAP).text

        # RFC2045 - Base64 Content-Transfer-Encoding (page 25)
        # Any characters outside of the base64 alphabet are to be ignored in
        # base64-encoded data.
        return signature_value.replace("\n", "")

    # -------------------------------------------------------------------------
    # TBAI SERVER CALLS
    # -------------------------------------------------------------------------

    def _l10n_es_tbai_post_to_web_service(self, invoices, invoice_xml, cancel=False):
        company = invoices.company_id
        xml_str = etree.tostring(invoice_xml, encoding='UTF-8')

        # === Call the web service ===

        # Get connection data
        url = company.get_l10n_es_tbai_url_cancel() if cancel else company.get_l10n_es_tbai_url_invoice()
        header = {"Content-Type": "application/xml; charset=UTF-8"}
        cert_file = company.l10n_es_tbai_certificate_id

        # Post and retrieve response
        try:
            response = TicketBaiWebServices()._post(url=url, data=xml_str, headers=header, pkcs12_data=cert_file, timeout=10)
        except (ValueError, RequestException) as e:
            return {invoices: {
                'success': False, 'error': str(e), 'blocking_level': 'warning', 'response': None
            }}

        data = response.content.decode(response.encoding)

        # Error management
        response_xml = etree.fromstring(bytes(data, 'utf-8'))
        message, already_received, tbai_id = TicketBaiWebServices()._get_response_values(response_xml, self.env)

        # TODO log warning if tbai_id provided in response does not match our own computed tbai_id ?
        # when already_received is True, tbai_id is '' (the response does not include it)
        # thus it's kind of pointless but if it did happen, it would definitely mean sth went wrong

        state = int(response_xml.find(r'.//Estado').text)
        if state == 0 or already_received:
            # SUCCESS
            return {invoices: {
                'success': True, 'message': message,
                'response': response_xml}}
        else:
            # ERROR
            return {invoices: {
                'success': False, 'error': message, 'blocking_level': 'error',
                'response': response_xml}}
