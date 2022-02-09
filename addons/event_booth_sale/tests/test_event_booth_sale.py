# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from datetime import datetime, timedelta

from odoo import fields
from odoo import Command
from odoo.addons.event_booth_sale.tests.common import TestEventBoothSaleCommon
from odoo.tests.common import users
from odoo.tools import float_compare, float_round


class TestEventBoothSale(TestEventBoothSaleCommon):

    @classmethod
    def setUpClass(cls):
        super(TestEventBoothSale, cls).setUpClass()

        cls.event_0 = cls.env['event.event'].create({
            'name': 'TestEvent',
            'auto_confirm': True,
            'date_begin': fields.Datetime.to_string(datetime.today() + timedelta(days=1)),
            'date_end': fields.Datetime.to_string(datetime.today() + timedelta(days=15)),
            'date_tz': 'Europe/Brussels',
        })

        cls.booth_1 = cls.env['event.booth'].create({
            'name': 'Test Booth 1',
            'booth_category_id': cls.event_booth_category_1.id,
            'event_id': cls.event_0.id,
        })

        cls.booth_2 = cls.env['event.booth'].create({
            'name': 'Test Booth 2',
            'booth_category_id': cls.event_booth_category_1.id,
            'event_id': cls.event_0.id,
        })

    @users('user_sales_salesman')
    def test_event_booth_sale(self):
        sale_order = self.env['sale.order'].create({
            'partner_id': self.event_customer.id,
            'pricelist_id': 1,
            'order_line': [
                Command.create({
                    'product_id': self.event_booth_product.id,
                    'event_id': self.event_0.id,
                    'event_booth_category_id': self.event_booth_category_1.id,
                    'event_booth_pending_ids': (self.booth_1 + self.booth_2).ids
                })
            ]
        })

        expected_price = sum((self.booth_1.booth_category_id + self.booth_2.booth_category_id).with_context(
            pricelist=sale_order.pricelist_id.id).mapped('price_reduce'))
        self.assertEqual(self.event_booth_product.list_price, self.booth_1.price,
                         "Booth price should be equal from product price.")
        self.assertEqual(sale_order.amount_untaxed, expected_price,
                         "Amount should be the sum of the booths prices.")

        self.event_booth_category_1.write({'price': 100.0})
        sale_order.update_prices()

        expected_price = sum((self.booth_1.booth_category_id + self.booth_2.booth_category_id).with_context(
            pricelist=sale_order.pricelist_id.id).mapped('price_reduce'))
        self.assertNotEqual(self.event_booth_product.list_price, self.booth_1.price,
                            "Booth price should be different from product price.")
        self.assertEqual(float_compare(sale_order.amount_untaxed, expected_price, precision_rounding=0.1), 0,
                         "Amount should be the sum of the booths prices.")
