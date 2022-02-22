# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.addons.project.tests.test_project_profitability import TestProjectProfitabilityCommon


class TestSaleProjectProfitabilityCommon(TestProjectProfitabilityCommon):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        uom_unit = cls.env.ref('uom.product_uom_unit').id

        # Create material product
        cls.material_product = cls.env['product.product'].create({
            'name': 'Material',
            'type': 'consu',
            'standard_price': 5,
            'list_price': 10,
            'invoice_policy': 'order',
            'uom_id': uom_unit.id,
            'uom_po_id': uom_unit.id,
        })

        # Create service products
        uom_hour = cls.env.ref('uom.product_uom_hour')
        cls.product_order_service1 = cls.env['product.product'].create({
            'name': "Service Ordered, create no task",
            'standard_price': 11,
            'list_price': 13,
            'type': 'service',
            'invoice_policy': 'order',
            'uom_id': uom_hour.id,
            'uom_po_id': uom_hour.id,
            'default_code': 'SERV-ORDERED1',
            'service_tracking': 'no',
            'project_id': False,
        })
        cls.product_order_service2 = cls.env['product.product'].create({
            'name': "Service Ordered, create task in global project",
            'standard_price': 30,
            'list_price': 90,
            'type': 'service',
            'invoice_policy': 'order',
            'uom_id': uom_hour.id,
            'uom_po_id': uom_hour.id,
            'default_code': 'SERV-ORDERED2',
            'service_tracking': 'task_global_project',
            'project_id': cls.project_global.id,
        })
        cls.sale_order = cls.env['sale.order'].with_context(tracking_disable=True).create({
            'partner_id': cls.partner.id,
            'partner_invoice_id': cls.partner.id,
            'partner_shipping_id': cls.partner.id,
        })
        SaleOrderLine = cls.env['sale.order.line'].with_context(tracking_disable=True, default_order_id=cls.sale_order.id)
        cls.order_service_1_order_line = SaleOrderLine.create({
            'product_id': cls.product_order_service1.id,
            'product_uom_qty': 10,
        })
        cls.sale_order.action_confirm()


class TestSaleProjectProfitability(TestSaleProjectProfitabilityCommon):
    def test_project_profitability(self):
        self.assertDictEqual(
            self.project._get_profitability_items(False),
            self.project_profitability_empty,
            'No data for the project profitability should be found since no SO is linked to that project.'
        )
        self.project.sale_line_id = self.order_service_1_order_line
        self.assertDictEqual(
            self.project._get_profitability_items(False),
            self.project_profitability_empty,
            'No data for the project profitability should be found since no product is delivered in the SO linked.'
        )
        self.order_service_1_order_line.qty_delivered = 1
        self.assertDictEqual(
            self.project._get_profitability_items(False),
            {
                'revenues': {
                    'data': [
                        {
                            'id': 'service_revenues',
                            'name': 'Timesheets (Billed on Milestones)',
                            'invoiced': self.order_service_1_order_line.untaxed_amount_to_invoice,
                            'to_invoice': self.order_service_1_order_line.untaxed_amount_invoiced,
                            'record_ids': self.order_service_1_order_line.ids,
                        },
                    ],
                    'total': {
                        'to_invoice': self.order_service_1_order_line.untaxed_amount_to_invoice,
                        'invoiced': self.order_service_1_order_line.untaxed_amount_invoiced,
                    },
                },
                'costs': {
                    'data': [],
                    'total': {'billed': 0.0, 'to_bill': 0.0},
                },
            }
        )
        self.assertEqual(self.order_service_1_order_line.untaxed_amount_to_invoice, 1 * 13)
        self.assertEqual(self.order_service_1_order_line.untaxed_amount_invoiced, 0.0)

        # create an invoice
        context = {
            'active_model': 'sale.order',
            'active_ids': self.sale_order.ids,
            'active_id': self.sale_order.id,
        }
        self.env['sale.advance.payment.inv'].with_context(context).create({
            'advance_payment_method': 'delivered',
        }).create_invoices()

        self.assertEqual(self.order_service_1_order_line.qty_invoiced, 1)
        self.assertEqual(self.order_service_1_order_line.untaxed_amount_to_invoice, 0.0)
        self.assertEqual(self.order_service_1_order_line.untaxed_amount_invoiced, 1 * 13)

        # Add 2 sales order items in the SO
        order_service_2_order_line = self.env['sale.order.line'].create({
            'product_id': self.product_order_service2,
            'product_uom_qty': 5,
            'qty_delivered': 5,
        })
        material_order_line = self.env['sale.order.line'].create({
            'product_id': self.material_product.id,
            'product_uom_qty': 1,
            'qty_delivered': 1,
        })
        service_sols = self.order_service_1_order_line + order_service_2_order_line
        self.assertDictEqual(
            self.project._get_profitability_items(False),
            {
                'revenues': {
                    'data': [
                        {
                            'id': 'service_revenues',
                            'name': 'Timesheets (Billed on Milestones)',
                            'invoiced': sum(service_sols.mapped('untaxed_amount_to_invoice')),
                            'to_invoice': sum(service_sols.mapped('untaxed_amount_invoiced')),
                            'record_ids': service_sols.ids,
                        },
                        {
                            'id': 'other_revenues',
                            'name': 'Material',
                            'invoiced': material_order_line.untaxed_amount_invoiced,
                            'to_invoice': material_order_line.untaxed_amount_to_invoice,
                            'record_ids': [material_order_line.id],
                        },
                    ],
                    'total': {
                        'invoiced': 0.0,  # since no sale order items have been invoiced.
                        'to_invoice': material_order_line.untaxed_amount_to_invoice,
                    },
                },
                'costs': {  # no cost because we have no purchase orders.
                    'data': [],
                    'total': {'billed': 0.0, 'to_bill': 0.0},
                },
            },
        )
        self.assertEqual(order_service_2_order_line.untaxed_amount_to_invoice, 5 * 90)
        self.assertEqual(order_service_2_order_line.untaxed_amount_invoiced, 0.0)
        self.assertEqual(material_order_line.untaxed_amount_to_invoice, 1 * 10)
        self.assertEqual(material_order_line.untaxed_amount_invoiced, 0.0)
