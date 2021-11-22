/** @odoo-module **/

import PaymentScreen from 'point_of_sale.PaymentScreen';
import Registries from 'point_of_sale.Registries';
import session from 'web.session';

export const PosLoyaltyPaymentScreen = (PaymentScreen) =>
    class extends PaymentScreen {
        async _postPushOrderResolve(order, server_ids) {
            //TODO: validate coupons here (see pos_coupon/static/src/js/PaymentScreen.js)
            return super._postPushOrderResolve(order, server_ids);
        }
    };

Registries.Component.extend(PaymentScreen, PosLoyaltyPaymentScreen);
