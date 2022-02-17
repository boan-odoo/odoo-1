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


class MercadoPagoController(http.Controller):

    _url_checkout_return = '/payment/mercado_pago/checkout_return'
    _url_validation_return = '/payment/mercado_pago/validation_return'

    @http.route(_url_checkout_return, type='http', auth='public', csrf=False)
    def mercado_pago_return_from_checkout(self, **data):
        """ Process the notification data sent by Mercado Pago after redirection from checkout.

        :param dict data: The GET params appended to the URL in
            `_mercado_pago_create_checkout_session`
        """
        # Retrieve the tx based on the tx reference included in the return url
        tx_sudo = request.env['payment.transaction'].sudo()._get_tx_from_notification_data(
            'mercado_pago', data
        )

        # Handle the notification data crafted with Stripe API objects
        tx_sudo._handle_notification_data('mercado_pago', data)

        # Redirect the user to the status page
        return request.redirect('/payment/status')

    @http.route(_url_validation_return, type='http', auth='public', csrf=False)
    def mercado_pago_return_from_validation(self, **data):
        """ Process the notification data sent by Mercado Pago after redirection for validation.

        :param dict data: The GET params appended to the URL in
            `_mercado_pago_create_checkout_session`
        """
        # Retrieve the transaction based on the tx reference included in the return url
        tx_sudo = request.env['payment.transaction'].sudo()._get_tx_from_notification_data(
            'mercado_pago', data
        )

        # Handle the notification data crafted with Stripe API objects
        tx_sudo._handle_notification_data('mercado_pago', data)

        # Redirect the user to the status page
        return request.redirect('/payment/status')

    @http.route('/payment/mercado_pago/get_acquirer_info', type='json', auth='public')
    def mercado_pago_get_acquirer_info(self, acquirer_id):
        """ Return public information on the acquirer.

        :param int acquirer_id: The acquirer handling the transaction, as a `payment.acquirer` id
        :return: Information on the acquirer, namely: the state, payment method type, login ID, and
                 public client key
        :rtype: dict
        """
        acquirer_sudo = request.env['payment.acquirer'].sudo().browse(acquirer_id).exists()
        return {
            'state': acquirer_sudo.state,
            # The public API key solely used to identify the seller account with Authorize.Net
            'public_key': acquirer_sudo.mercado_pago_public_key,
        }