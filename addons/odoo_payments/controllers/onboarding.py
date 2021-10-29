# Part of Odoo. See LICENSE file for full copyright and licensing details.

import logging

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class OnboardingController(http.Controller):

    """ This controller is responsible for the onboarding (account creation) flow of Odoo Payments.

    The following routes are exposed:
    - `/odoo_payments/get_creation_redirect_form` retrieve the creation redirect form of the Adyen
      account in the current company.
    """

    @http.route('/odoo_payments/get_creation_redirect_form', type='json', auth='user')
    def odoo_payments_creation_redirect_form(self):
        """ Return the account creation form used to redirect the user to the merchant database.

        :return: The account creation form
        :rtype: str
        """
        return request.env.company.adyen_account_id._get_creation_redirect_form()

    @http.route('/odoo_payments/return', type='http', methods=['GET'], auth='user')
    def odoo_payments_return_from_redirect(self, account_code, adyen_uuid, proxy_token):
        """ Update the account with the data received from the merchant and redirect to the account.

        The user is redirected to this route by the merchant instance (odoo.com) after having been
        redirected there to create the submerchant.

        :param str account_code: TODO
        :param str adyen_uuid: TODO
        :param str proxy_token: TODO
        """
        # TODO save feedback on account
        # TODO make sure the account being updated is the one where the redirection flow started
        request.env.company.adyen_account_id.write({
            'merchant_status': 'pending',  # The validation was successfully initiated
        })  # TODO
        return request.redirect('/web#action=odoo_payments.action_create_or_view_adyen_account')
