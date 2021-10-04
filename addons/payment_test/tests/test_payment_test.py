# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo.tests import tagged

from .common import PaymentTestCommon
from odoo.addons.website.tools import MockRequest

@tagged('-at_install', 'post_install')
class PaymentTestTest(PaymentTestCommon):

    def test_controller_payment_test(self):
        tx = self.create_transaction(flow='redirect', reference='S0001')
        with MockRequest(self.env):
            self.PaymentTestController.test_simulate_payment(
                reference='S0001',
                customer_input='3746356486794756',
                status='done',
            )

        self.assertEqual(
            tx.state,
            'done',
            msg="The transaction state should be 'done' when a payment is made from the portal.",
        )

    def test_controller_cancel_payment_test(self):
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
            msg="The transaction state should be 'cancel' when a payment is made from the portal "
                "and status passed to the controller is 'cancel'.",
        )

    def test_controller_pending_payment_test(self):
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
            msg="The transaction state should be 'pending' when a payment is made from the portal "
                "and status passed to the controller is 'pending'.",
        )

    def test_controller_error_payment_test(self):
        tx = self.create_transaction(flow='redirect', reference='S0001')
        with MockRequest(self.env):
            self.PaymentTestController.test_simulate_payment(
                reference='S0001',
                customer_input='3746356486794756',
                status='error',
            )

        self.assertEqual(
            tx.state,
            'error',
            msg="The transaction state should be 'error' when a payment is made from the portal "
                "and status passed to the controller is 'error'.",
        )

    def test_redirect_form_with_fees_payment_test(self):
        # update acquirer: compute fees
        self.test.write({
            'fees_active': True,
            'fees_dom_fixed': 1.0,
            'fees_dom_var': 0.35,
            'fees_int_fixed': 1.5,
            'fees_int_var': 0.50,
        })

        transaction_fees = self.currency.round(
            self.test._compute_fees(
                self.amount,
                self.currency,
                self.partner.country_id,
            )
        )
        self.assertEqual(transaction_fees, 7.09)
        total_fee = self.currency.round(self.amount + transaction_fees)
        self.assertEqual(total_fee, 1118.2)

        tx = self.create_transaction(flow='redirect')
        self.assertEqual(tx.fees, 7.09)

    def test_full_refund_payment_test(self):
        tx = self.create_transaction(flow='redirect', reference='S0001', state='done')
        tx._reconcile_after_done()  # Create the payment

        refund_tx = tx._send_refund_request()
        refund_tx._reconcile_after_done()  # Create the payment

        self.assertEqual(tx.payment_id.refunds_count, 1, msg="")
        self.assertEqual(tx.amount, -refund_tx.amount, msg="")


    def test_partial_refund_payment_test(self):
        tx = self.create_transaction(flow='redirect', reference='S0001', state='done')
        tx._reconcile_after_done()  # Create the payment

        refund_tx = tx._send_refund_request(500)
        refund_tx._reconcile_after_done()  # Create the payment

        self.assertEqual(tx.payment_id.refunds_count, 1, msg="")
        self.assertEqual(refund_tx.amount, -500, msg="")

    def test_multiple_partial_refund_payment_test(self):
        tx = self.create_transaction(flow='redirect', reference='S0001', state='done')
        tx._reconcile_after_done()  # Create the payment

        refund_tx = tx._send_refund_request(500)
        refund_tx._reconcile_after_done()  # Create the payment

        second_refund_tx = tx._send_refund_request(500)
        second_refund_tx._reconcile_after_done()  # Create the payment

        self.assertEqual(tx.payment_id.refunds_count, 2, msg="")
        self.assertEqual(refund_tx.amount, -500, msg="")
        self.assertEqual(second_refund_tx.amount, -500, msg="")

    def test_refund_no_transaction_payment_test(self):
        tx = self.create_transaction(flow='redirect', reference='S0001', state='done')
        tx._reconcile_after_done()  # Create the payment

        refund_tx = tx._send_refund_request(500, False)
        self.assertEqual(len(refund_tx), 0, msg="")
        self.assertEqual(tx.payment_id.refunds_count, 0, msg="")
