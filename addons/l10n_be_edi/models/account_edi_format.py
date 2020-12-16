# -*- coding: utf-8 -*-

from odoo import api, models, fields
from odoo.tools import float_repr

import base64


class AccountEdiFormat(models.Model):
    _inherit = 'account.edi.format'

    ####################################################
    # Account.edi.format override
    ####################################################

    def _is_compatible_with_journal(self, journal):
        self.ensure_one()
        res = super()._is_compatible_with_journal(journal)
        if self.code != 'efff_1':
            return res
        return journal.type == 'sale' and journal.country_code == 'BE'

    def _post_invoice_edi(self, invoices, test_mode=False):
        self.ensure_one()
        if self.code != 'efff_1':
            return super()._post_invoice_edi(invoices, test_mode=test_mode)
        res = {}
        for invoice in invoices:
            attachment = self._export_efff(invoice)
            res[invoice] = {'attachment': attachment}
        return res

    def _is_embedding_to_invoice_pdf_needed(self):
        self.ensure_one()
        if self.code != 'efff_1':
            return super()._is_embedding_to_invoice_pdf_needed()
        return False  # ubl must not be embedded to PDF.

    ####################################################
    # account_edi_ubl override
    ####################################################

    def _is_ubl(self, filename, tree):
        if self.code != 'efff_1':
            return super()._is_ubl(filename, tree)
        return super()._is_generic_ubl(filename, tree)

    def _get_ubl_values(self, invoice):
        values = super()._get_ubl_values(invoice)
        if self.code != 'efff_1':
            return values

        # E-fff uses ubl_version 2.0, account_edi_ubl supports ubl_version 2.1 but generates 2.0 UBL
        # so we only need to override the version to be compatible with E-FFF
        values['ubl_version'] = 2.0

        return values

    ####################################################
    # Export
    ####################################################

    def _export_efff(self, invoice):
        self.ensure_one()
        # Create file content.
        xml_content = b"<?xml version='1.0' encoding='UTF-8'?>"
        xml_content += self.env.ref('account_edi_ubl.export_ubl_invoice')._render(self._get_ubl_values(invoice))
        vat = invoice.company_id.partner_id.commercial_partner_id.vat
        xml_name = 'efff-%s%s%s.xml' % (vat or '', '-' if vat else '', invoice.name.replace('/', '_'))  # official naming convention
        return self.env['ir.attachment'].create({
            'name': xml_name,
            'datas': base64.encodebytes(xml_content),
            'res_model': 'account.move',
            'res_id': invoice._origin.id,
            'mimetype': 'application/xml'
        })
