# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.addons.point_of_sale.tests.test_frontend import TestPointOfSaleHttpCommon
from odoo.tests import Form, tagged


@tagged("post_install", "-at_install")
class TestUi(TestPointOfSaleHttpCommon):
    def setUp(self):
        super().setUp()

        # Disable any programs during the test
        self.env['loyalty.program'].search([]).write({'active': False})

        self.promo_programs = self.env["loyalty.program"]

        # code promo program -> discount on specific products
        self.code_promo_program = self.env['loyalty.program'].create({
            'name': 'Promo Code Program - Discount on Specific Products',
            'program_type': 'promotion',
            'trigger': 'with_code',
            'applies_on': 'current',
            'rule_ids': [(0, 0, {
                'mode': 'with_code',
                'code': 'promocode',
            })],
            'reward_ids': [(0, 0, {
                'reward_type': 'discount',
                'discount': 50,
                'discount_mode': 'percent',
                'discount_applicability': 'specific',
                'discount_product_ids': self.whiteboard_pen | self.magnetic_board | self.desk_organizer,
            })],
        })
        self.promo_programs |= self.code_promo_program

        # auto promo program on current order
        #   -> discount on cheapest product
        self.auto_promo_program_current = self.env['loyalty.program'].create({
            'name': 'Auto Promo Program - Cheapest Product',
            'program_type': 'promotion',
            'trigger': 'auto',
            'rule_ids': [(0, 0, {})],
            'reward_ids': [(0, 0, {
                'reward_type': 'discount',
                'discount': 90,
                'discount_mode': 'percent',
                'discount_applicability': 'cheapest',
            })]
        })
        self.promo_programs |= self.auto_promo_program_current

        # auto promo program on next order
        #   -> discount on order (global discount)
        self.auto_promo_program_next = self.env['loyalty.program'].create({
            'name': 'Auto Promo Program - Global Discount',
            'program_type': 'promotion',
            'trigger': 'auto',
            'applies_on': 'future',
            'rule_ids': [(0, 0, {})],
            'reward_ids': [(0, 0, {
                'reward_type': 'discount',
                'discount': 10,
                'discount_mode': 'percent',
                'discount_applicability': 'order',
            })]
        })
        self.promo_programs |= self.auto_promo_program_next

        # coupon program -> free product
        self.coupon_program = self.env['loyalty.program'].create({
            'name': 'Coupon Program - Buy 3 Take 2 Free Product',
            'program_type': 'coupons',
            'trigger': 'with_code',
            'applies_on': 'current',
            'rule_ids': [(0, 0, {
                'product_ids': self.desk_organizer,
                'reward_point_mode': 'unit',
                'minimum_qty': 3,
            })],
            'reward_ids': [(0, 0, {
                'reward_type': 'product',
                'reward_product_id': self.desk_organizer.id,
                'reward_product_qty': 1,
                'required_points': 1.5,
            })],
        })

        # Create coupons for the coupon program and change the code
        # to be able to use them in the frontend tour.
        self.env["loyalty.generate.wizard"].with_context(
            {"active_id": self.coupon_program.id}
        ).create({"coupon_qty": 4, 'points_granted': 4.5}).generate_coupons()
        self.coupon1, self.coupon2, self.coupon3, self.coupon4 = self.coupon_program.coupon_ids
        self.coupon1.write({"code": "1234"})
        self.coupon2.write({"code": "5678"})
        self.coupon3.write({"code": "1357"})
        self.coupon4.write({"code": "2468"})

    def test_pos_coupon_tour_basic(self):
        """PoS Coupon Basic Tour"""

        # Set the programs to the pos config.
        # Remove fiscal position and pricelist.
        with Form(self.main_pos_config) as pos_config:
            pos_config.tax_regime_selection = False
            pos_config.use_pricelist = False
            pos_config.pricelist_id = self.env["product.pricelist"].create(
                {"name": "PoS Default Pricelist",}
            )
            pos_config.use_coupon_programs = True
            pos_config.coupon_program_ids.add(self.coupon_program)
            for promo_program in self.promo_programs:
                pos_config.promo_program_ids.add(promo_program)

        self.main_pos_config.open_session_cb()

        ##
        # Tour Part 1
        # This part will generate coupons for `auto_promo_program_next`
        # that will be used in the second part of the tour.
        #

        self.start_tour(
            "/pos/web?config_id=%d" % self.main_pos_config.id,
            "PosCouponTour1",
            login="accountman",
        )

        # check coupon usage
        self.assertEqual(self.coupon1.points, 0, 'The coupon should have consumed its points.')
        self.assertEqual(self.coupon2.points, 4.5, 'The coupon was used but never validated.')
        # check pos_order_count in each program
        self.assertEqual(self.auto_promo_program_current.pos_order_count, 3)
        self.assertEqual(self.auto_promo_program_next.pos_order_count, 0)
        self.assertEqual(self.code_promo_program.pos_order_count, 1)
        self.assertEqual(self.coupon_program.pos_order_count, 1)
        # check number of generated coupons
        self.assertEqual(len(self.auto_promo_program_next.coupon_ids), 5)
        # check number of orders in the session
        pos_session = self.main_pos_config.current_session_id
        self.assertEqual(
            len(pos_session.order_ids), 5, msg="5 orders were made in tour part1."
        )

        ##
        # Tour Part 2
        # The coupons generated in the first part will be used in this tour.
        #

        # Manually set the code for some `auto_promo_program_next` coupons
        # to be able to use them in defining the part2 tour.
        (
            promo_coupon1,
            promo_coupon2,
            promo_coupon3,
            promo_coupon4,
            *_,
        ) = self.auto_promo_program_next.coupon_ids
        promo_coupon1.write({"code": "123456"})
        promo_coupon2.write({"code": "345678"})
        promo_coupon3.write({"code": "567890"})
        promo_coupon4.write({"code": "098765"})

        self.coupon2.points = 6
        self.coupon3.points = 3

        # use here the generated coupon
        self.start_tour(
            "/pos/web?config_id=%d" % self.main_pos_config.id,
            "PosCouponTour2",
            login="accountman",
        )
        # check pos_order_count in each program
        self.assertEqual(self.auto_promo_program_current.pos_order_count, 6)
        self.assertEqual(self.auto_promo_program_next.pos_order_count, 2)
        self.assertEqual(self.code_promo_program.pos_order_count, 2)
        self.assertEqual(self.coupon_program.pos_order_count, 3)
