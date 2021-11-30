# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.exceptions import ValidationError
from odoo.tests import tagged, TransactionCase

@tagged('post_install', '-at_install')
class TestLoyalty(TransactionCase):

    def test_discount_product_unlink(self):
        program = self.env['loyalty.program'].create({
            'name': 'Test Program',
            'reward_ids': [(0, 0, {})],
        })
        with self.assertRaises(ValidationError):
            program.reward_ids.discount_line_product_id.unlink()
