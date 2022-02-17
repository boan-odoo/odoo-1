/* global Stripe */
odoo.define('payment_mercado_pago.payment_form', require => {
    'use strict';

    const checkoutForm = require('payment.checkout_form');
    const manageForm = require('payment.manage_form');

    const MercadoPagoMixin = {

        /**
         * Redirect the customer to Mercado Pago hosted payment page.
         *
         * @override method from payment.payment_form_mixin
         * @private
         * @param {string} provider - The provider of the payment option's acquirer
         * @param {number} paymentOptionId - The id of the payment option handling the transaction
         * @param {object} processingValues - The processing values of the transaction
         * @return {undefined}
         */
        _processRedirectPayment: function (provider, paymentOptionId, processingValues) {
            if (provider !== 'mercado_pago') {
                return this._super(...arguments);
            }

            const mercadoPagoJS = new MercadoPago(processingValues['public_key']);

            const checkout = mercadoPagoJS.checkout({
                preference: {
                    id: processingValues["token_id"]
                },
            });

            checkout.open()

        },

    };

    checkoutForm.include(MercadoPagoMixin);
    manageForm.include(MercadoPagoMixin);

});
