/* @odoo-module */
'use strict';

import Chrome from 'point_of_sale.Chrome';
import Registries from 'point_of_sale.Registries';
import { onPosBroadcast } from '@point_of_sale/js/pos_broadcast';

const PosAdyenChrome = Chrome => class PosAdyenChrome extends Chrome {
    constructor() {
        super(...arguments);
        onPosBroadcast('adyen-payment-status-received', this._onAdyenPaymentStatusReceived);
    }
    async _onAdyenPaymentStatusReceived([paymentMethodId, paymentStatus]) {
        const paymentMethod = this.payment_methods_from_config.find(pm => pm.id == paymentMethodId);
        if (paymentMethod.payment_terminal.hasWaitingPaymentRequest) {
            // TODO: Check if the received verification is for the pending payment.
            paymentMethod.payment_terminal.handlePaymentStatus(paymentStatus);
        }
    }
}

Registries.Component.extend(Chrome, PosAdyenChrome);

export default Chrome
