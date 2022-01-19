odoo.define('point_of_sale.PosModal', function(require) {
    'use strict';

    const Registries = require('point_of_sale.Registries');
    const PosComponent = require('point_of_sale.PosComponent');
    const { useBus } = require("@web/core/utils/hooks");

    class PosModal extends PosComponent {
        setup() {
            super.setup();
            useBus(this.env.posbus, 'show-popup', this.__showPopup);
            useBus(this.env.posbus, 'close-popup', this.__closePopup);
            this.popups = [];
        }
        __showPopup({ detail }) {
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
        __closePopup({ detail: id }) {
            const index = this.popups.findIndex(popup => popup.props.id == id);
            if (index != -1) {
                this.popups.splice(index, 1);
                this.render();
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
