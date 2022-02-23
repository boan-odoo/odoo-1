odoo.define('point_of_sale.PosModal', function(require) {
    'use strict';

    const Registries = require('point_of_sale.Registries');
    const PosComponent = require('point_of_sale.PosComponent');
    const { useBus } = require("@web/core/utils/hooks");

    class PosModal extends PosComponent {
        setup() {
            super.setup();
            owl.useExternalListener(window, 'keyup', this._cancelTopPopupAtEscape);
            useBus(this.env.posbus, 'show-popup', this._showPopup);
            useBus(this.env.posbus, 'close-popup', this._closePopup);
            this.popups = [];
        }
        _showPopup({ detail }) {
            const { id, name, props, resolve } = detail;
            const component = this.constructor.components[name];
            if (component.dontShow) {
                resolve();
                return;
            }
            this.popups.push({
                name,
                component,
                props: Object.assign(props || {}, { id, resolve }),
                key: `${name}-${id}`
            });
            this.render();
        }
        _closePopup({ detail: id }) {
            const index = this.popups.findIndex(popup => popup.props.id == id);
            if (index != -1) {
                this.popups.splice(index, 1);
                this.render();
            }
        }
        _cancelTopPopupAtEscape(event) {
            const topPopup = this.popups[this.popups.length - 1];

            /**
             * Do nothing:
             *  - when pressed key is not `Escape` or
             *  - when no topPopup or
             *  - when the topPopup is notEscapable.
             */
            if (event.key !== 'Escape' || !topPopup || topPopup.props.notEscapable) return;

            // Find the rendered popup component and call its cancel method.
            const topPopupNode = Object.values(this.__owl__.children).find(
                (node) => node.component.props.id == topPopup.props.id
            );
            if (topPopupNode) {
                return topPopupNode.component.cancel();
            }
        }
        isShown() {
            return this.popups.length > 0;
        }
    }
    PosModal.template = 'point_of_sale.PosModal';
    Registries.Component.add(PosModal);

    return PosModal;
});
