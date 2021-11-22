/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent';
import ProductScreen from 'point_of_sale.ProductScreen';
import { useListener } from 'web.hooks';
import Registries from 'point_of_sale.Registries';

export class ResetProgramsButton extends PosComponent {
    constructor() {
        super(...arguments);
        useListener('click', this.onClick);
    }

    async onClick() {
        this.env.pos.get_order().reset_programs();
        this.trigger('close-popup');
    }
}

ResetProgramsButton.template = 'ResetProgramsButton';

ProductScreen.addControlButton({
    component: ResetProgramsButton,
    condition: function () {
        return this.env.pos.config.use_coupon_programs;
    }
});

Registries.component.add(ResetProgramsButton);
