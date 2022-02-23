# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import logging

from odoo.addons.account.tests.common import AccountTestInvoicingCommon
from odoo.tests import tagged


@tagged('post_install_l10n', 'post_install', '-at_install')
class QRPrintTest(AccountTestInvoicingCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref='l10n_ch.l10nch_chart_template'):
        super().setUpClass(chart_template_ref=chart_template_ref)

    def print_qr_bill(self, invoice):
        _logger = logging.getLogger(__name__)
        try:
            invoice.action_invoice_sent()
            return True
        except Exception as e:
            _logger.warning(e.name)
            return False

    def test_print_qr(self):
        self.env.company.partner_id.country_id = self.env.ref('base.ch').id
        # the partner must be located in Switzerland.
        self.partner = self.env['res.partner'].create({
            'name': 'Bobby',
            'country_id': self.env.ref('base.ch').id,
        })
        # The bank account must be QR-compatible
        qr_bank_account = self.env['res.partner.bank'].create({
            'acc_number': "CH4431999123000889012",
            'partner_id': self.env.company.partner_id.id,
            'l10n_ch_isr_subscription_chf': '01-39139-1',
        })
        correct_invoice_chf = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'partner_bank_id': qr_bank_account.id,
            'currency_id': self.env.ref('base.CHF').id,
            'invoice_date': '2019-01-01',
            'invoice_line_ids': [(0, 0, {'product_id': self.product_a.id})],
        })
        correct_invoice_chf.action_post()
        self.assertTrue(self.print_qr_bill(correct_invoice_chf))

        #The QR can also be printed if the currency is EUR
        self.env.ref('base.EUR').active = True
        correct_invoice_eur = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'partner_bank_id': qr_bank_account.id,
            'currency_id': self.env.ref('base.EUR').id,
            'invoice_date': '2019-01-01',
            'invoice_line_ids': [(0, 0, {'product_id': self.product_a.id})],
        })
        correct_invoice_eur.action_post()
        self.assertTrue(self.print_qr_bill(correct_invoice_eur))

        #A normal invoice will be printed if the partner is not from Switzerland
        wrong_partner_invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner_a.id,
            'partner_bank_id': qr_bank_account.id,
            'currency_id': self.env.ref('base.EUR').id,
            'invoice_date': '2019-01-01',
            'invoice_line_ids': [(0, 0, {'product_id': self.product_a.id})],
        })

        wrong_partner_invoice.action_post()
        self.assertTrue(self.print_qr_bill(wrong_partner_invoice))
        #However, a qr bill can't be printed with those infos
        self.assertFalse(wrong_partner_invoice.l10n_ch_is_qr_valid)
