# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.tests import tagged, Form
from odoo.addons.sale.tests.test_sale_common import TestSale

from odoo.tools import html2plaintext


@tagged('post_install', '-at_install')
class TestSaleStockInvoices(TestSale):

    def setUp(self):
        super(TestSaleStockInvoices, self).setUp()

        self.product_by_lot = self.env['product.product'].create({
            'name': 'Product By Lot',
            'type': 'product',
            'tracking': 'lot',
        })
        self.warehouse = self.env['stock.warehouse'].search([('company_id', '=', self.env.company.id)], limit=1)
        self.stock_location = self.warehouse.lot_stock_id
        self.lot = self.env['stock.production.lot'].create({
            'name': 'LOT0001',
            'product_id': self.product_by_lot.id,
            'company_id': self.env.company.id,
        })
        self.env['stock.quant']._update_available_quantity(self.product_by_lot, self.stock_location, 10, lot_id=self.lot)

    def test_invoice_less_than_delivered(self):
        """
        Suppose the lots are printed on the invoices.
        A user invoice a tracked product with a smaller quantity than delivered.
        On the invoice, the quantity of the used lot should be the invoiced one.
        """
        display_lots = self.env.ref('sale_stock.group_lot_on_invoice')
        display_uom = self.env.ref('uom.group_uom')
        self.env.user.write({'groups_id': [(4, display_lots.id), (4, display_uom.id)]})

        so = self.env['sale.order'].create({
            'partner_id': self.partner.id,
            'order_line': [
                (0, 0, {'name': self.product_by_lot.name, 'product_id': self.product_by_lot.id, 'product_uom_qty': 5}),
            ],
        })
        so.action_confirm()

        picking = so.picking_ids
        picking.move_lines.quantity_done = 5
        picking.button_validate()

        invoice = so._create_invoices()
        with Form(invoice) as form:
            with form.invoice_line_ids.edit(0) as line:
                line.quantity = 2
        invoice.action_post()

        report = self.env['ir.actions.report']._get_report_from_name('account.report_invoice_with_payments')
        html = report.render_qweb_html(invoice.ids)[0]
        text = html2plaintext(html)
        self.assertRegex(text, r'Product By Lot\n2.000\nUnits\nLOT0001', "There should be a line that specifies 2 x LOT0001")

    def test_invoice_before_delivery(self):
        """
        Suppose the lots are printed on the invoices.
        The user sells a tracked product, its invoicing policy is "Ordered quantities"
        A user invoice a tracked product with a smaller quantity than delivered.
        On the invoice, the quantity of the used lot should be the invoiced one.
        """
        display_lots = self.env.ref('sale_stock.group_lot_on_invoice')
        display_uom = self.env.ref('uom.group_uom')
        self.env.user.write({'groups_id': [(4, display_lots.id), (4, display_uom.id)]})

        self.product_by_lot.invoice_policy = "order"

        so = self.env['sale.order'].create({
            'partner_id': self.partner.id,
            'order_line': [
                (0, 0, {'name': self.product_by_lot.name, 'product_id': self.product_by_lot.id, 'product_uom_qty': 4}),
            ],
        })
        so.action_confirm()

        invoice = so._create_invoices()
        invoice.action_post()

        picking = so.picking_ids
        picking.move_lines.quantity_done = 4
        picking.button_validate()

        report = self.env['ir.actions.report']._get_report_from_name('account.report_invoice_with_payments')
        html = report.render_qweb_html(invoice.ids)[0]
        text = html2plaintext(html)
        self.assertRegex(text, r'Product By Lot\n4.000\nUnits\nLOT0001', "There should be a line that specifies 4 x LOT0001")

    def test_backorder_and_reset_invoice(self):
        """
        Suppose the lots are printed on the invoices.
        The user sells 4 tracked products, he delivers 1 product and invoices it
        Then, he delivers the last 3 and invoice them. Each invoice should have the
        correct lot quantities (even if an invoice is reset+posted in the meantime)
        """
        report = self.env['ir.actions.report']._get_report_from_name('account.report_invoice_with_payments')
        display_lots = self.env.ref('sale_stock.group_lot_on_invoice')
        display_uom = self.env.ref('uom.group_uom')
        self.env.user.write({'groups_id': [(4, display_lots.id), (4, display_uom.id)]})

        so = self.env['sale.order'].create({
            'partner_id': self.partner.id,
            'order_line': [
                (0, 0, {'name': self.product_by_lot.name, 'product_id': self.product_by_lot.id, 'product_uom_qty': 4}),
            ],
        })
        so.action_confirm()

        picking = so.picking_ids
        picking.move_lines.quantity_done = 1
        picking.button_validate()
        action = picking.button_validate()
        wizard = self.env[action['res_model']].browse(action['res_id'])
        wizard.process()

        invoice01 = so._create_invoices()
        with Form(invoice01) as form:
            with form.invoice_line_ids.edit(0) as line:
                line.quantity = 1
        invoice01.action_post()

        backorder = picking.backorder_ids
        backorder.move_lines.quantity_done = 3
        backorder.button_validate()

        invoice01.button_draft()
        invoice01.post()
        html = report.render_qweb_html(invoice01.ids)[0]
        text = html2plaintext(html)
        self.assertRegex(text, r'Product By Lot\n1.000\nUnits\nLOT0001', "There should be a line that specifies 1 x LOT0001")

        invoice02 = so._create_invoices()
        invoice02.post()
        html = report.render_qweb_html(invoice02.ids)[0]
        text = html2plaintext(html)
        self.assertRegex(text, r'Product By Lot\n3.000\nUnits\nLOT0001', "There should be a line that specifies 3 x LOT0001")
