# Part of Odoo. See LICENSE file for full copyright and licensing details.

import logging
import pprint

from werkzeug import urls

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError

from odoo.addons.payment import utils as payment_utils
from odoo.addons.payment_mercado_pago.controllers.main import MercadoPagoController

_logger = logging.getLogger(__name__)


class PaymentTransaction(models.Model):
    _inherit = 'payment.transaction'

    mercado_pago_payment_intent = fields.Char(string="Mercado Pago Payment Intent ID", readonly=True)

    def _get_specific_processing_values(self, processing_values):
        """ Override of payment to return Mercado Pago-specific processing values.

        Note: self.ensure_one() from `_get_processing_values`

        :param dict processing_values: The generic processing values of the transaction
        :return: The dict of acquirer-specific processing values
        :rtype: dict
        """

        res = super()._get_specific_processing_values(processing_values)
        if self.provider != 'mercado_pago':
            return res

        # Create a preference to get a redirection url of Mercado Pago to initiate
        # the payment flow
        preference = {}  # self._mercado_pago_create_preference(self.reference)

        redirection_url = ""
        if self.acquirer_id.state == "test":
            redirection_url = preference.get("sandbox_init_point", '')
        else:
            redirection_url = preference.get("init_point", '')

        return {
            'public_key': self.acquirer_id.mercado_pago_public_key,
            'redirection_url': redirection_url,
            "token_id": preference.get("id", '')
        }

    def _mercado_pago_create_preference(self, external_reference, items=None, **kwargs):
        """
        Create a preference for mercado pago to get the redirection url to begin the
        payment flow

        """

        if self.operation == "validation":
            back_urls = {
                "success": MercadoPagoController._url_validation_return,
                "pending": MercadoPagoController._url_validation_return,
                "failure": MercadoPagoController._url_validation_return,

            }
        if self.operation == "online_redirect":
            back_urls = {
                "success": MercadoPagoController._url_checkout_return,
                "pending": MercadoPagoController._url_checkout_return,
                "failure": MercadoPagoController._url_checkout_return,

            }
        else:
            back_urls = {}

        if items is None:
            items = [{
                "title": "Payment",
                "quantity": 1,
                "unit_price": self.amount,
                "currency_id": self.currency_id.name
            }]

        payer = {
            "name": self.partner_name or {},
            "email": self.partner_email or {},
            "phone": {
                "area_code": "",
                "number": self.partner_phone or "",
            },
            "address": {
                "zip_code": self.partner_zip or "",
                "street_name": self.partner_address or "",
                "street_number": "",
            },
        }

        data = {
            "auto_return": "all",
            "back_urls": back_urls,
            "external_reference": external_reference,
            "payer": payer,
            "items": items,
            "statement_descriptor": "MERCADOPAGO",
            **kwargs
        }

        return self.acquirer_id._mercado_pago_make_request("/checkout/preferences", "POST", data)

    def _send_payment_request(self):
        """ Override of payment to send a payment request to Stripe with a confirmed PaymentIntent.

        Note: self.ensure_one()

        :return: None
        :raise: UserError if the transaction is not linked to a token
        """
        super()._send_payment_request()
        if self.provider != 'mercado_pago':
            return

        response = {}  # to get the response from Mercado Pago
        feedback_data = ""

        _logger.info(
            "payment request response for transaction with reference %s:\n%s",
            self.reference, pprint.pformat(response)
        )
        self._handle_notification_data('mercado_pago', feedback_data)

    def _get_tx_from_notification_data(self, provider, notification_data):
        """ Override of payment to find the transaction based on Stripe data.

        :param str provider: The provider of the acquirer that handled the transaction
        :param dict notification_data: The notification data sent by the provider
        :return: The transaction if found
        :rtype: recordset of `payment.transaction`
        :raise: ValidationError if inconsistent data were received
        :raise: ValidationError if the data match no transaction
        """
        tx = super()._get_tx_from_notification_data(provider, notification_data)
        if provider != 'mercado_pago':
            return tx

        reference = notification_data.get('reference')
        if not reference:
            raise ValidationError("Mercado Pago: " + _("Received data with missing merchant reference"))

        tx = self.search([('reference', '=', reference), ('provider', '=', 'mercado_pago')])
        if not tx:
            raise ValidationError(
                "Mercado Pago: " + _("No transaction found matching reference %s.", reference)
            )
        return tx

    def _process_notification_data(self, notification_data):
        """ Override of payment to process the transaction based on Mercado Pago data.

        Note: self.ensure_one()

        :param dict notification_data: The notification data build from information passed to the
                                       return route.
        :return: None
        :raise: ValidationError if inconsistent data were received
        """
        super()._process_notification_data(notification_data)
        if self.provider != 'mercado_pago':
            return

        # Handle the notification data here and get the necessary values

        # this part should process the notification and alter self in dependency
        if intent_status in INTENT_STATUS_MAPPING['draft']:
            pass
        elif intent_status in INTENT_STATUS_MAPPING['pending']:
            self._set_pending()
        elif intent_status in INTENT_STATUS_MAPPING['done']:
            if self.tokenize:
                self._mercado_pago_tokenize_from_notification_data(notification_data)
            self._set_done()
        elif intent_status in INTENT_STATUS_MAPPING['cancel']:
            self._set_canceled()
        else:  # Classify unknown intent statuses as `error` tx state
            _logger.warning(
                "received invalid payment status (%s) for transaction with reference %s",
                intent_status, self.reference
            )
            self._set_error(
                "Mercado Pago: " + _("Received data with invalid status: %s", "")
            )

    def _mercado_pago_tokenize_from_notification_data(self, notification_data):
        """ Create a new token based on the notification data.

        :param dict notification_data: The notification data built with Stripe objects.
                                       See `_process_notification_data`.
        :return: None
        """
        if self.operation == 'online_redirect':
            payment_method_id = notification_data.get('charge', {}).get('payment_method')
            customer_id = notification_data.get('charge', {}).get('customer')
        else:  # 'validation'
            payment_method_id = notification_data.get('setup_intent', {}) \
                .get('payment_method', {}).get('id')
            customer_id = notification_data.get('setup_intent', {}).get('customer')
        payment_method = notification_data.get('payment_method')
        if not payment_method_id or not payment_method:
            _logger.warning(
                "requested tokenization from notification data with missing payment method"
            )
            return

        if payment_method.get('type') != 'card':
            # Only 'card' payment methods can be tokenized. This case should normally not happen as
            # non-recurring payment methods are not shown to the customer if the "Save my payment
            # details checkbox" is shown. Still, better be on the safe side..
            _logger.warning("requested tokenization of non-recurring payment method")
            return

        token = self.env['payment.token'].create({
            'acquirer_id': self.acquirer_id.id,
            'name': payment_utils.build_token_name(payment_method['card'].get('last4')),
            'partner_id': self.partner_id.id,
            'acquirer_ref': customer_id,
            'verified': True,
            'mercado_pago_payment_method': payment_method_id,
        })
        self.write({
            'token_id': token,
            'tokenize': False,
        })
        _logger.info(
            "created token with id %(token_id)s for partner with id %(partner_id)s from "
            "transaction with reference %(ref)s",
            {
                'token_id': token.id,
                'partner_id': self.partner_id.id,
                'ref': self.reference,
            },
        )
