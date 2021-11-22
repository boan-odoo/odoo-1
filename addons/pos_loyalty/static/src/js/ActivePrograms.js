/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent';
import Registries from 'point_of_sale.Registries';
import { onChangeOrder } from 'point_of_sale.hooks';

export class ActivePrograms extends PosComponent {
    constructor() {
        super(...arguments);
        onChangeOrder(this._onPrevOrder, this._onNewOrder);
        this.renderParams = {};
    }
    
    _onPrevOrder(prevOrder) {
        if (prevOrder) {
            prevOrder.off('change', null, this);
            prevOrder.off('rewards-updated', null, this);
        }
    }

    _onNewOrder(newOrder) {
        if (newOrder) {
            newOrder.on('change', this.render, this);
            newOrder.on('rewards-updated', this.render, this);
            newOrder.trigger('update-rewards');
        }
    }

    async render() {
        this._setRenderParams();
        await super.render();
    }

    get currentOrder() {
        return this.env.pos.get_order();
    }

    _setRenderParams() {
        const order = this.currentOrder;
        const activePrograms = order.couponPointChanges.map((pe) => this.pos.program_by_id[pe.program_id]);
        const seenRewards = new Set();
        const activeRewards = [];
        for (const line of order.get_reward_lines()) {
            const key = line.reward_id + '-' + line.coupon_id + '-' + line.reward_identifier_code;
            if (seenRewards.has(key)) {
                continue;
            }
            seenRewards.add(key);
            const dbCoupon = this.pos.couponCache.find((c) => c.id === line.coupon_id);
            const couponCode = dbCoupon ? dbCoupon.code : false;
            activeRewards.push({
                name: line.get_product().display_name,
                code: couponCode,
            })
        }
        Object.assign(this.renderParams, {
            activePrograms,
            activeRewards,
        });
    }
}
ActivePrograms.template = 'ActivePrograms';

Registries.Component.add(ActivePrograms);
