# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.addons.sale_loyalty.tests.common import TestSaleCouponCommon
from odoo.tests import Form, tagged


@tagged('post_install', '-at_install')
class TestSaleCouponProgramRules(TestSaleCouponCommon):

    @classmethod
    def setUpClass(cls):
        super(TestSaleCouponProgramRules, cls).setUpClass()
        cls.iPadMini = cls.env['product.product'].create({'name': 'Large Cabinet', 'list_price': 320.0})
        tax_15pc_excl = cls.env['account.tax'].create({
            'name': "15% Tax excl",
            'amount_type': 'percent',
            'amount': 15,
        })
        cls.product_delivery_poste = cls.env['product.product'].create({
            'name': 'The Poste',
            'type': 'service',
            'categ_id': cls.env.ref('delivery.product_category_deliveries').id,
            'sale_ok': False,
            'purchase_ok': False,
            'list_price': 20.0,
            'taxes_id': [(6, 0, [tax_15pc_excl.id])],
        })
        cls.carrier = cls.env['delivery.carrier'].create({
            'name': 'The Poste',
            'fixed_price': 20.0,
            'delivery_type': 'base_on_rule',
            'product_id': cls.product_delivery_poste.id,
        })
        cls.env['delivery.price.rule'].create([{
            'carrier_id': cls.carrier.id,
            'max_value': 5,
            'list_base_price': 20,
        }, {
            'carrier_id': cls.carrier.id,
            'operator': '>=',
            'max_value': 5,
            'list_base_price': 50,
        }, {
            'carrier_id': cls.carrier.id,
            'operator': '>=',
            'max_value': 300,
            'variable': 'price',
            'list_base_price': 0,
        }])


    # Test a free shipping reward + some expected behavior
    # (automatic line addition or removal)

    def test_free_shipping_reward(self):
        # Test case 1: The minimum amount is not reached, the reward should
        # not be created
        self.immediate_promotion_program.active = False
        program = self.env['loyalty.program'].create({
            'name': 'Free Shipping if at least 100 euros',
            'trigger': 'auto',
            'rule_ids': [(0, 0, {
                'minimum_amount': 100,
                'minimum_amount_tax_mode': 'incl',
            })],
            'reward_ids': [(0, 0, {
                'reward_type': 'shipping',
            })],
        })

        order = self.env['sale.order'].create({
            'partner_id': self.steve.id,
        })

        # Price of order will be 5*1.15 = 5.75 (tax included)
        order.write({'order_line': [
            (0, False, {
                'product_id': self.product_B.id,
                'name': 'Product B',
                'product_uom': self.uom_unit.id,
                'product_uom_qty': 1.0,
            })
        ]})
        self._auto_rewards(order, program)
        self.assertEqual(len(order.order_line.ids), 1)

        # I add delivery cost in Sales order
        delivery_wizard = Form(self.env['choose.delivery.carrier'].with_context({
            'default_order_id': order.id,
            'default_carrier_id': self.env['delivery.carrier'].search([])[1]
        }))
        choose_delivery_carrier = delivery_wizard.save()
        choose_delivery_carrier.button_confirm()

        self._auto_rewards(order, program)
        self.assertEqual(len(order.order_line.ids), 2)

        # Test Case 1b: amount is not reached but is on a threshold
        # The amount of deliverable product + the one of the delivery exceeds the minimum amount
        # yet the program shouldn't be applied
        # Order price will be 5.75 + 81.74*1.15 = 99.75
        order.write({'order_line': [
            (0, False, {
                'product_id': self.product_B.id,
                'name': 'Product 1B',
                'product_uom': self.uom_unit.id,
                'product_uom_qty': 1.0,
                'price_unit': 81.74,
            })
        ]})
        self._auto_rewards(order, program)
        self.assertEqual(len(order.order_line.ids), 3)

        # Test case 2: the amount is sufficient, the shipping should
        # be reimbursed
        order.write({'order_line': [
            (0, False, {
                'product_id': self.product_A.id,
                'name': 'Product 1',
                'product_uom': self.uom_unit.id,
                'product_uom_qty': 1.0,
                'price_unit': 0.30,
            })
        ]})

        self._auto_rewards(order, program)
        self.assertEqual(len(order.order_line.ids), 5)

        # Test case 3: the amount is not sufficient now, the reward should be removed
        order.write({'order_line': [
            (2, order.order_line.filtered(lambda line: line.product_id.id == self.product_A.id).id, False)
        ]})
        self._auto_rewards(order, program)
        self.assertEqual(len(order.order_line.ids), 3)

    def test_shipping_cost(self):
        # Free delivery should not be taken into account when checking for minimum required threshold
        p_minimum_threshold_free_delivery = self.env['loyalty.program'].create({
            'name': 'free shipping if > 872 tax excl',
            'trigger': 'auto',
            'rule_ids': [(0, 0, {
                'minimum_amount': 872,
            })],
            'reward_ids': [(0, 0, {
                'reward_type': 'shipping',
            })]
        })
        p_2 = self.env['loyalty.program'].create({
            'name': '10% reduction if > 872 tax excl',
            'trigger': 'auto',
            'rule_ids': [(0, 0, {
                'minimum_amount': 872,
            })],
            'reward_ids': [(0, 0, {
                'reward_type': 'discount',
                'discount': 10,
                'discount_mode': 'percent',
                'discount_applicability': 'order',
            })]
        })
        programs = (p_minimum_threshold_free_delivery | p_2)
        order = self.empty_order
        self.iPadMini.taxes_id = self.tax_10pc_incl
        sol1 = self.env['sale.order.line'].create({
            'product_id': self.iPadMini.id,
            'name': 'Large Cabinet',
            'product_uom_qty': 3.0,
            'order_id': order.id,
        })
        self._auto_rewards(order, programs)
        self.assertEqual(len(order.order_line.ids), 2, "We should get the 10% discount line since we bought 872.73$")
        order.carrier_id = self.env['delivery.carrier'].search([])[1]

        # I add delivery cost in Sales order
        delivery_wizard = Form(self.env['choose.delivery.carrier'].with_context({
            'default_order_id': order.id,
            'default_carrier_id': self.env['delivery.carrier'].search([])[1]
        }))
        choose_delivery_carrier = delivery_wizard.save()
        choose_delivery_carrier.button_confirm()

        self._auto_rewards(order, programs)
        self.assertEqual(len(order.order_line.ids), 4, "We should get both rewards regardless of applying order.")

        p_minimum_threshold_free_delivery.sequence = 10
        (order.order_line - sol1).unlink()
        # I add delivery cost in Sales order
        delivery_wizard = Form(self.env['choose.delivery.carrier'].with_context({
            'default_order_id': order.id,
            'default_carrier_id': self.env['delivery.carrier'].search([])[1]
        }))
        choose_delivery_carrier = delivery_wizard.save()
        choose_delivery_carrier.button_confirm()
        self._auto_rewards(order, programs)
        self.assertEqual(len(order.order_line.ids), 4, "We should get both rewards regardless of applying order.")

    def test_shipping_cost_numbers(self):
        # Free delivery should not be taken into account when checking for minimum required threshold
        p_1 = self.env['loyalty.program'].create({
            'name': 'Free shipping if > 872 tax excl',
            'trigger': 'with_code',
            'rule_ids': [(0, 0, {
                'mode': 'with_code',
                'code': 'free_shipping',
                'minimum_amount': 872,
            })],
            'reward_ids': [(0, 0, {
                'reward_type': 'shipping',
            })],
        })
        p_2 = self.env['loyalty.program'].create({
            'name': 'Buy 4 large cabinet, get one for free',
            'trigger': 'auto',
            'rule_ids': [(0, 0, {
                'product_ids': self.iPadMini,
                'minimum_qty': 4,
            })],
            'reward_ids': [(0, 0, {
                'reward_type': 'product',
                'reward_product_id': self.iPadMini.id,
                'reward_product_qty': 1,
                'required_points': 1,
            })],
        })
        programs = (p_1 | p_2)
        order = self.empty_order
        self.iPadMini.taxes_id = self.tax_10pc_incl
        sol1 = self.env['sale.order.line'].create({
            'product_id': self.iPadMini.id,
            'name': 'Large Cabinet',
            'product_uom_qty': 3.0,
            'order_id': order.id,
        })

        # I add delivery cost in Sales order
        delivery_wizard = Form(self.env['choose.delivery.carrier'].with_context({
            'default_order_id': order.id,
            'default_carrier_id': self.carrier.id
        }))
        choose_delivery_carrier = delivery_wizard.save()
        choose_delivery_carrier.button_confirm()
        self._auto_rewards(order, programs)
        self.assertEqual(len(order.order_line.ids), 2)
        self.assertEqual(order.reward_amount, 0)
        # Shipping is 20 + 15%tax
        self.assertEqual(sum([line.price_total for line in order._get_no_effect_on_threshold_lines()]), 23)
        self.assertEqual(order.amount_untaxed, 872.73 + 20)

        self._apply_promo_code(order, 'free_shipping')
        self._auto_rewards(order, programs)
        self.assertEqual(len(order.order_line.ids), 3, "We should get the delivery line and the free delivery since we are below 872.73$")
        self.assertEqual(order.reward_amount, -20)
        self.assertEqual(sum([line.price_total for line in order._get_no_effect_on_threshold_lines()]), 0)
        self.assertEqual(order.amount_untaxed, 872.73)

        sol1.product_uom_qty = 4
        self._auto_rewards(order, programs)
        self.assertEqual(len(order.order_line.ids), 4, "We should get a free Large Cabinet")
        self.assertEqual(order.reward_amount, -20 - 320)
        self.assertEqual(sum([line.price_total for line in order._get_no_effect_on_threshold_lines()]), 0)
        self.assertEqual(order.amount_untaxed, 1163.64)

        programs |= self.env['loyalty.program'].create({
            'name': '20% reduction on large cabinet in cart',
            'trigger': 'auto',
            'rule_ids': [(0, 0, {})],
            'reward_ids': [(0, 0, {
                'reward_type': 'discount',
                'discount': 20,
                'discount_mode': 'percent',
                'discount_applicability': 'cheapest',
            })]
        })
        # import pdb; pdb.set_trace()
        self._auto_rewards(order, programs)
        # 872.73 - (20% of 1 iPad) = 872.73 - 58.18 = 814.55
        self.assertAlmostEqual(order.amount_untaxed, 1105.46, 2, "One large cabinet should be discounted by 20%")
