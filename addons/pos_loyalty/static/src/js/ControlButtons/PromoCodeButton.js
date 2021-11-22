/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent';
import ProductScreen from 'point_of_sale.ProductScreen';
import { useListener } from 'web.custom_hooks';
import Registries from 'point_of_sale.Registries';

export class PromoCodeButton extends PosComponent {
    constructor() {
        super(...arguments);
        useListener('click', this.onClick);
    }

    async onClick() {
        const { confirmed, payload: code } = await this.showPopup('TextInputPopup', {
            title: this.env._t('Enter Promotion or Coupon Code'),
            startingValue: '',
        });
        if (confirmed && code !== '') {
            this.env.pos.get_order().activate_code(code);
        }
    }
}

PromoCodeButton.template = 'PromoCodeButton';

ProductScreen.addControlButton({
    component: PromoCodeButton,
    condition: function () {
        return this.env.pos.config.use_coupon_programs;
    }
});

Registries.Component.add(PromoCodeButton);
