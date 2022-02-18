# -*- coding: utf-8 -*-
from odoo import fields
from odoo.addons.account.tests.common import AccountTestInvoicingCommon
from odoo.tests import tagged


@tagged('post_install_l10n', 'post_install', '-at_install')
class TestL10nPt(AccountTestInvoicingCommon):
    @classmethod
    def setUpClass(cls, chart_template_ref='l10n_pt.pt_chart_template'):
        super().setUpClass(chart_template_ref=chart_template_ref)
        cls.company_data['company'].write({
            'street': '250 Executive Park Blvd, Suite 3400',
            'city': 'Lisboa',
            'zip': '9415-343',
            'company_registry': '123456',
            'phone': '+351 11 11 11 11',
            'country_id': cls.env.ref('base.pt').id,
            'vat': 'PT123456789',
        })

    def test_l10n_pt_hash(self):
        self.company_pt = self.company_data['company']
        out_invoice1 = self.init_invoice('out_invoice',
                                         invoice_date=fields.Date.from_string('2022-01-01'),
                                         company=self.company_pt,
                                         products=self.product_a,
                                         post=True)
        out_invoice2 = self.init_invoice('out_invoice',
                                         invoice_date=fields.Date.from_string('2022-02-02'),
                                         company=self.company_pt,
                                         products=self.product_b,
                                         post=True)
        in_invoice1 = self.init_invoice('in_invoice',
                                        invoice_date=fields.Date.from_string('2022-02-02'),
                                        company=self.company_pt,
                                        products=self.product_b,
                                        post=True)
        out_invoice3 = self.init_invoice('out_invoice',
                                         invoice_date=fields.Date.from_string('2021-02-03'),
                                         company=self.company_pt,
                                         products=self.product_a+self.product_b,
                                         post=True)
        out_refund1 = self.init_invoice('out_refund',
                                        invoice_date=fields.Date.from_string('2021-02-03'),
                                        company=self.company_pt,
                                        products=self.product_a+self.product_b,
                                        post=True)
        in_refund1 = self.init_invoice('in_refund',
                                       invoice_date=fields.Date.from_string('2021-02-03'),
                                       company=self.company_pt,
                                       products=self.product_a+self.product_b,
                                       post=True)
        in_refund2 = self.init_invoice('in_refund',
                                       invoice_date=fields.Date.from_string('2021-02-03'),
                                       company=self.company_pt,
                                       products=self.product_a,
                                       post=True)
        out_invoice4 = self.init_invoice('out_invoice',
                                         invoice_date=fields.Date.from_string('2021-02-03'),
                                         company=self.company_pt,
                                         products=self.product_a+self.product_b,
                                         post=True)

        self.assertEqual(out_invoice1.inalterable_hash, 'I')
        self.assertEqual(out_invoice2.inalterable_hash, 'II')
        self.assertEqual(out_invoice3.inalterable_hash, 'III')
        self.assertEqual(out_invoice4.inalterable_hash, 'IIII')
        self.assertEqual(in_invoice1.inalterable_hash, 'I')
        self.assertEqual(out_refund1.inalterable_hash, 'I')
        self.assertEqual(in_refund1.inalterable_hash, 'I')
        self.assertEqual(in_refund2.inalterable_hash, 'II')
