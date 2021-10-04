# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo.addons.payment_test.controllers.main import PaymentTestController
from odoo.addons.payment.tests.common import PaymentCommon


class PaymentTestCommon(PaymentCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        cls.test = cls._prepare_acquirer('test', update_values={
            'payment_icon_ids': [(5, 0, 0)],
            'capture_manually': False, # Only activate manual capture in dedicated tests
            'fees_active': False, # Only activate fees in dedicated tests
        })

        cls.acquirer = cls.test

        cls.PaymentTestController = PaymentTestController()
