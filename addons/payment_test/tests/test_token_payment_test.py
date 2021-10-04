# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo.tests import tagged

from .common import PaymentTestCommon
from odoo.addons.payment import utils as payment_utils
from odoo.addons.website.tools import MockRequest


@tagged('-at_install', 'post_install')
class PaymentTestTokenTest(PaymentTestCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        cls.token = cls.env['payment.token'].create({
            'acquirer_id': cls.acquirer.id,
            'name': payment_utils.build_token_name(payment_details_short='4756'),
            'partner_id': cls.partner.id,
            'acquirer_ref': 'fake acquirer reference',
            'verified': True,
        })

    def test_token_transaction_state_with_manual_capture(self):
        self.acquirer.capture_manually = True

        tx = self.create_transaction(flow='redirect')
        tx.token_id = self.token.id
        tx._send_payment_request()

        self.assertEqual(
            tx.state,
            'authorized',
            msg="Payment through token: The transaction state should be 'authorized' when manual "
                "capture is enabled.",
        )

        tx._send_capture_request()
        self.assertEqual(
            tx.state,
            'done',
            msg="Payment through token: The transaction state should be 'done' when a capture "
                "request is sent over an authorized transaction",
        )

    def test_token_transaction_state_void_with_manual_capture(self):
        self.acquirer.capture_manually = True

        tx = self.create_transaction(flow='redirect')
        tx.token_id = self.token.id
        tx._send_payment_request()
        tx._send_void_request()
        self.assertEqual(
            tx.state,
            'cancel',
            msg="Payment through token: The transaction state should be 'cancel' when a void "
                "request is sent over an authorized transaction",
        )

    def test_token_transaction_state_without_manual_capture(self):
        tx = self.create_transaction(flow='redirect')
        tx.token_id = self.token.id
        tx._send_payment_request()
        self.assertEqual(
            tx.state,
            'done',
            msg="Payment through token: The transaction state should be 'done' when manual capture "
                "isn't enabled.",
        )

    def test_controller_tokenize(self):
        tx = self.create_transaction(flow='redirect', tokenize=True, reference='S0001')
        with MockRequest(self.env):
            self.PaymentTestController.test_simulate_payment(
                reference='S0001',
                customer_input='3746356486794756',
                status='done',
            )

        self.assertEqual(
            tx.token_id.name,
            self.token.name,
            msg="The token name are different.",
        )
        self.assertEqual(
            tx.token_id.provider,
            self.token.provider,
            msg="The token provider are different.",
        )
        self.assertEqual(
            tx.token_id.acquirer_id,
            self.token.acquirer_id,
            msg="The token acquirer_id are different.",
        )
        self.assertEqual(
            tx.token_id.partner_id,
            self.token.partner_id,
            msg="The token partner_id are different.",
        )
        self.assertEqual(
            tx.token_id.acquirer_ref,
            self.token.acquirer_ref,
            msg="The token acquirer_ref are different.",
        )
        self.assertEqual(
            tx.token_id.state,
            self.token.state,
            msg="The token state are different.",
        )

    def test_controller_tokenize_state_error(self):
        tx = self.create_transaction(flow='redirect', tokenize=True, reference='S0001')
        with MockRequest(self.env):
            self.PaymentTestController.test_simulate_payment(
                reference='S0001',
                customer_input='3746356486794756',
                status='error',
            )

        self.assertEqual(
            tx.token_id.state,
            'error',
            msg="The token state should be 'error' when a payment is made from the portal "
                "and status passed to the controller is 'error'.",
        )

    def test_controller_tokenize_state_cancel(self):
        tx = self.create_transaction(flow='redirect', tokenize=True, reference='S0001')
        with MockRequest(self.env):
            self.PaymentTestController.test_simulate_payment(
                reference='S0001',
                customer_input='3746356486794756',
                status='cancel',
            )

        self.assertEqual(
            tx.token_id.state,
            'cancel',
            msg="The token state should be 'cancel' when a payment is made from the portal "
                "and status passed to the controller is 'cancel'.",
        )

    def test_controller_tokenize_state_pending(self):
        tx = self.create_transaction(flow='redirect', tokenize=True, reference='S0001')
        with MockRequest(self.env):
            self.PaymentTestController.test_simulate_payment(
                reference='S0001',
                customer_input='3746356486794756',
                status='pending',
            )

        self.assertEqual(
            tx.token_id.state,
            'pending',
            msg="The token state should be 'pending' when a payment is made from the portal "
                "and status passed to the controller is 'pending'.",
        )
