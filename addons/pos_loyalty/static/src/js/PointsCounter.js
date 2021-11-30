/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent';
import Registries from 'point_of_sale.Registries';

export class PointsCounter extends PosComponent {
    get_points() {
        return this.env.pos.get_order().getLoyaltyPoints();
    }
}

PointsCounter.template = 'PointsCounter';

Registries.Component.add(PointsCounter);
