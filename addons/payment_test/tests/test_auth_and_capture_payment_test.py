# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo.tests import tagged

from .common import PaymentTestCommon
from odoo.addons.website.tools import MockRequest


@tagged('-at_install', 'post_install')
class PaymentTestAuthAndCaptureTest(PaymentTestCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        cls.acquirer.capture_manually = True

    def test_transaction_state_with_manual_capture(self):
        tx = self.create_transaction(flow='redirect', reference='S0001')
        with MockRequest(self.env):
            self.PaymentTestController.test_simulate_payment(
                reference='S0001',
                customer_input='3746356486794756',
                status='done',
            )

        self.assertEqual(
            tx.state,
            'authorized',
            msg="The transaction state should be 'authorized' when manual capture is enabled.",
        )

        tx._send_capture_request()
        self.assertEqual(
            tx.state,
            'done',
            msg="The transaction state should be 'done' when a capture request is sent over an "
                "authorized transaction",
        )

    def test_transaction_state_void_with_manual_capture(self):
        tx = self.create_transaction(flow='redirect', reference='S0001')
        with MockRequest(self.env):
            self.PaymentTestController.test_simulate_payment(
                reference='S0001',
                customer_input='3746356486794756',
                status='done',
            )

        tx._send_void_request()
        self.assertEqual(
            tx.state,
            'cancel',
            msg="The transaction state should be 'cancel' when a void request is sent over an "
                "authorized transaction",
        )

    def test_state_pending_manual_capture(self):
        tx = self.create_transaction(flow='redirect', reference='S0001')
        with MockRequest(self.env):
            self.PaymentTestController.test_simulate_payment(
                reference='S0001',
                customer_input='3746356486794756',
                status='pending',
            )

        self.assertEqual(
            tx.state,
            'pending',
            msg="The transaction state should be 'pending' when manual capture is enabled but "
                "status received from the controller is 'pending'.",
        )

    def test_state_cancel_manual_capture(self):
        tx = self.create_transaction(flow='redirect', reference='S0001')
        with MockRequest(self.env):
            self.PaymentTestController.test_simulate_payment(
                reference='S0001',
                customer_input='3746356486794756',
                status='cancel',
            )

        self.assertEqual(
            tx.state,
            'cancel',
            msg="The transaction state should be 'cancel' when manual capture is enabled but "
                "status received from the controller is 'cancel'.",
        )
