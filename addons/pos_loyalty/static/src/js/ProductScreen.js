/** @odoo-module **/

import ProductScreen from 'point_of_sale.ProductScreen';
import Registries from 'point_of_sale.Registries';
import { useBarcodeReader } from 'point_of_sale.hooks';

export const PosLoyaltyProductScreen = (ProductScreen) =>
    class extends ProductScreen {
        constructor() {
            super(...arguments);
            useBarcodeReader({
                coupon: this._onCouponScan,
            });
        }

        _onCouponScan(code) {
            this.currentOrder.activate_code(code.base_code);
        }

        async _updateSelectedOrderline(event) {
            const selectedLine = this.currentOrder.get_selected_orderline();
            if (selectedLine && selectedLine.is_reward_line && !selectedLine.manual_reward && event.detail.key === 'Backspace') {
                const reward = this.env.pos.reward_by_id[selectedLine.reward_id];
                const program = this.env.pos.program_by_id[reward.program_id];
                const { confirmed } = await this.showPopup('ConfirmPopup', {
                    title: this.env._t('Deactivating program'),
                    body: _.str.sprintf(
                        this.env._t('Are you sure you want to deactivate %s on this order?'),
                        program.name
                    ),
                    cancelText: this.env._t('No'),
                    confirmText: this.env._t('Yes'),
                });
                if (confirmed) {
                    event.detail.buffer = null;
                } else {
                    // Cancel backspace
                    return;
                }
            }
            return super._updateSelectedOrderline(...arguments);
        }


        /**
         * 1/ Perform the usual set value operation (super._setValue) if the line being modified
         * is not a reward line or if it is a reward line, the `val` being set is '' or 'remove' only.
         *
         * 2/ Update activated programs and coupons when removing a reward line.
         *
         * 3/ Trigger 'update-rewards' if the line being modified is a regular line or
         * if removing a reward line.
         *
         * @override
         */
        _setValue(val) {
            const selectedLine = this.currentOrder.get_selected_orderline();
            if (
                !selectedLine ||
                !selectedLine.is_reward_line ||
                (selectedLine.is_reward_line && ['', 'remove'].includes(val))
            ) {
                super._setValue(val);
            }
            if (!selectedLine) return;
            if (selectedLine.is_reward_line && val === 'remove') {
                const reward = this.env.pos.reward_by_id[selectedLine.reward_id];
                const program = this.env.pos.program_by_id[reward.program_id];
                const couponIdx = this.env.pos.couponCache.findIndex((c) => c.id === selectedLine.coupon_id);
                const coupon = couponIdx != -1 ? this.env.pos.couponCache[couponIdx] : null;
                if (coupon && coupon.id > 0 && this.currentOrder.codeActivatedCoupons.includes(coupon.code)) {
                    this.env.pos.couponCache.splice(couponIdx, 1);
                    delete this.currentOrder.codeActivatedCoupons[coupon.code];
                } else if (program) {
                    selectedLine.order.disabledPrograms.add(program.id);
                    this.showNotification(
                        `'${
                            program.name
                        }' program has been deactivated.`
                    );
                }
            }
            if (!selectedLine.is_reward_line || (selectedLine.is_reward_line && val === 'remove')) {
                selectedLine.order.trigger('update-rewards');
            }
        }
    };

Registries.Component.extend(ProductScreen, PosLoyaltyProductScreen);
