# Part of Odoo. See LICENSE file for full copyright and licensing details.

import hashlib
import hmac
import json
import logging
import pprint
from datetime import datetime

from werkzeug.exceptions import Forbidden

from odoo import http
from odoo.exceptions import ValidationError
from odoo.http import request

_logger = logging.getLogger(__name__)


class StripeController(http.Controller):
    _checkout_return_url = '/payment/stripe/checkout_return'
    _validation_return_url = '/payment/stripe/validation_return'
    _webhook_url = '/payment/stripe/webhook'
    WEBHOOK_AGE_TOLERANCE = 10*60  # seconds

    @http.route(_checkout_return_url, type='http', auth='public', csrf=False)
    def stripe_return_from_checkout(self, **data):
        """ Process the notification data sent by Stripe after redirection from checkout.

        :param dict data: The GET params appended to the URL in `_stripe_create_checkout_session`
        """
        # Retrieve the tx based on the tx reference included in the return url
        tx_sudo = request.env['payment.transaction'].sudo()._get_tx_from_feedback_data(
            'stripe', data
        )

        # Fetch the PaymentIntent, Charge and PaymentMethod objects from Stripe
        payment_intent = tx_sudo.acquirer_id._stripe_make_request(
            f'payment_intents/{tx_sudo.stripe_payment_intent}', method='GET'
        )
        _logger.info("received payment_intents response:\n%s", pprint.pformat(payment_intent))
        self._include_payment_intent_in_feedback_data(payment_intent, data)

        # Handle the feedback data crafted with Stripe API objects
        request.env['payment.transaction'].sudo()._handle_feedback_data('stripe', data)

        # Redirect the user to the status page
        return request.redirect('/payment/status')

    @http.route(_validation_return_url, type='http', auth='public', csrf=False)
    def stripe_return_from_validation(self, **data):
        """ Process the notification data sent by Stripe after redirection for validation.

        :param dict data: The GET params appended to the URL in `_stripe_create_checkout_session`
        """
        # Retrieve the transaction based on the tx reference included in the return url
        tx_sudo = request.env['payment.transaction'].sudo()._get_tx_from_feedback_data(
            'stripe', data
        )

        # Fetch the Session, SetupIntent and PaymentMethod objects from Stripe
        checkout_session = tx_sudo.acquirer_id._stripe_make_request(
            f'checkout/sessions/{data.get("checkout_session_id")}',
            payload={'expand[]': 'setup_intent.payment_method'},  # Expand all required objects
            method='GET'
        )
        _logger.info("received checkout/session response:\n%s", pprint.pformat(checkout_session))
        self._include_setup_intent_in_feedback_data(checkout_session.get('setup_intent', {}), data)

        # Handle the feedback data crafted with Stripe API objects
        request.env['payment.transaction'].sudo()._handle_feedback_data('stripe', data)

        # Redirect the user to the status page
        return request.redirect('/payment/status')

    @http.route(_webhook_url, type='json', auth='public')
    def stripe_webhook(self):
        """ Process the notification data sent by Stripe to the webhook.

        :return: An empty string to acknowledge the notification
        :rtype: str
        """
        event = json.loads(request.httprequest.data)
        _logger.info("notification received from Stripe with data:\n%s", pprint.pformat(event))
        try:
            if event['type'] == 'checkout.session.completed':
                checkout_session = event['data']['object']

                # Check the integrity of the event
                data = {'reference': checkout_session['client_reference_id']}
                tx_sudo = request.env['payment.transaction'].sudo()._get_tx_from_feedback_data(
                    'stripe', data
                )
                self._verify_notification_signature(tx_sudo)
                # Fetch the PaymentIntent, Charge and PaymentMethod objects from Stripe
                if checkout_session.get('payment_intent'):  # Can be None
                    payment_intent = tx_sudo.acquirer_id._stripe_make_request(
                        f'payment_intents/{tx_sudo.stripe_payment_intent}', method='GET'
                    )
                    _logger.info(
                        "received payment_intents response:\n%s", pprint.pformat(payment_intent)
                    )
                    self._include_payment_intent_in_feedback_data(payment_intent, data)

                # Fetch the SetupIntent and PaymentMethod objects from Stripe
                if checkout_session.get('setup_intent'):  # Can be None
                    setup_intent = tx_sudo.acquirer_id._stripe_make_request(
                        f'setup_intents/{checkout_session.get("setup_intent")}',
                        payload={'expand[]': 'payment_method'},
                        method='GET'
                    )
                    _logger.info(
                        "received setup_intents response:\n%s", pprint.pformat(setup_intent)
                    )
                    self._include_setup_intent_in_feedback_data(setup_intent, data)

                # Handle the feedback data crafted with Stripe API objects as a regular feedback
                request.env['payment.transaction'].sudo()._handle_feedback_data('stripe', data)
            elif event['type'] == 'charge.refunded': # handle refunds issued from Stripe
                charge = event['data']['object']

                # Check the source and integrity of the event
                data = {'reference': charge['description']}
                tx_sudo = request.env['payment.transaction'].sudo()._get_tx_from_feedback_data(
                    'stripe', data
                )
                self._verify_notification_signature(tx_sudo)
                # Get all refunds for this charge
                refunds = charge['refunds']['data']
                has_more = charge['refunds']['has_more']
                while has_more:
                    more_refunds = tx_sudo.acquirer_id._stripe_make_request(
                        # The url provided by Stripe begin by /v1/, but it's already included in
                        # _stripe_make_request()
                        charge['refunds']['url'][4:],
                        payload={'starting_after': refunds[-1].get('id')},
                        method='GET',
                    )
                    refunds += more_refunds['data']
                    has_more = more_refunds['has_more']

                # Process refunds we aren't aware of
                for refund in filter(lambda r: r['metadata'] == {}, refunds):
                    # _stripe_get_refund_tx() creates the transaction if it doesn't exist
                    refund_tx = request.env['payment.transaction'].sudo()._stripe_get_refund_tx(
                        tx_sudo, refund
                    )
                    # Update the reference on Stripe
                    refund = tx_sudo.acquirer_id._stripe_make_request(
                        f'refunds/{refund.get("id")}',
                        payload={'metadata[reference]': refund_tx.reference},
                        method='POST'
                    )
                    _logger.info(
                        "received refund response:\n%s", pprint.pformat(refund)
                    )
                    # We don't handle feedback data here because Stripe will send back
                    # immediately a 'charge.refund.updated', with the reference of the
                    # transaction that we just set, and it may result in a DB cursor error
                    # trying to write on the same transaction at the same time.
            elif event['type'] == 'charge.refund.updated': # handle update of all refunds
                refund = event['data']['object']

                refund.update(
                    reference=refund['metadata']['reference']
                )
                # Check the source and integrity of the event
                tx_sudo = request.env['payment.transaction'].sudo()._get_tx_from_feedback_data(
                    'stripe', refund
                )
                self._verify_notification_signature(tx_sudo)
                request.env['payment.transaction'].sudo()._handle_feedback_data('stripe', refund)
            else:
                _logger.exception(
                    "Stripe: received unsupported webhook notification (type: %s)", event['type']
                )
        except ValidationError:  # Acknowledge the notification to avoid getting spammed
            _logger.exception("unable to handle the notification data; skipping to acknowledge")
        return ''

    @staticmethod
    def _include_payment_intent_in_feedback_data(payment_intent, data):
        data.update({'payment_intent': payment_intent})
        if payment_intent.get('charges', {}).get('total_count', 0) > 0:
            charge = payment_intent['charges']['data'][0]  # Use the latest charge object
            data.update({
                'charge': charge,
                'payment_method': charge.get('payment_method_details'),
            })

    @staticmethod
    def _include_setup_intent_in_feedback_data(setup_intent, data):
        data.update({
            'setup_intent': setup_intent,
            'payment_method': setup_intent.get('payment_method')
        })

    def _verify_notification_signature(self, tx_sudo):
        """ Check that the received signature matches the expected one.

        See https://stripe.com/docs/webhooks/signatures#verify-manually.

        :param recordset tx_sudo: The sudoed transaction referenced by the notification data, as a
                                  `payment.transaction` record
        :return: None
        :raise: :class:`werkzeug.exceptions.Forbidden` if the timestamp is too old or if the
                signatures don't match
        """
        webhook_secret = tx_sudo.acquirer_id.stripe_webhook_secret
        if not webhook_secret:
            _logger.warning("ignored webhook event due to undefined webhook secret")
            return

        notification_payload = request.httprequest.data.decode('utf-8')
        signature_entries = request.httprequest.headers['Stripe-Signature'].split(',')
        signature_data = {k: v for k, v in [entry.split('=') for entry in signature_entries]}

        # Retrieve the timestamp from the data
        event_timestamp = int(signature_data.get('t', '0'))
        if not event_timestamp:
            _logger.warning("received notification with missing timestamp")
            raise Forbidden()

        # Check if the timestamp is not too old
        if datetime.utcnow().timestamp() - event_timestamp > self.WEBHOOK_AGE_TOLERANCE:
            _logger.warning("received notification with outdated timestamp: %s", event_timestamp)
            raise Forbidden()

        # Retrieve the received signature from the data
        received_signature = signature_data.get('v1')
        if not received_signature:
            _logger.warning("received notification with missing signature")
            raise Forbidden()

        # Compare the received signature with the expected signature computed from the data
        signed_payload = f'{event_timestamp}.{notification_payload}'
        expected_signature = hmac.new(
            webhook_secret.encode('utf-8'), signed_payload.encode('utf-8'), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(received_signature, expected_signature):
            _logger.warning("received notification with invalid signature")
            raise Forbidden()
