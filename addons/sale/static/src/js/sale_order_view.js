odoo.define('sale.SaleOrderView', function (require) {
    "use strict";

    const FormController = require('web.FormController');
    const FormView = require('web.FormView');
    const viewRegistry = require('web.view_registry');
    const Dialog = require('web.Dialog');
    const core = require('web.core');
    const _t = core._t;

    const SaleOrderFormController = FormController.extend({
        custom_events: _.extend({}, FormController.prototype.custom_events, {
            open_update_all_wizard: '_onOpenUpdateAllWizard',
        }),

        // -------------------------------------------------------------------------
        // Handlers
        // -------------------------------------------------------------------------

        /**
         * Handler called if user changes a value in the sale order line.
         * The wizard will open only if
         *  (1) Sale order line is 3 or more
         *  (2) First sale order line is changed
         *  (3) value is the same in all other sale order line
         */
        _onOpenUpdateAllWizard(ev) {
            const orderLines = this._DialogReady(ev, 'normal')
            if (orderLines) {
                Dialog.confirm(this, _t("Do you want to apply this value to all order lines?"), {
                    confirm_callback: () => {
                        orderLines.slice(1).forEach((line) => {
                            this.trigger_up('field_changed', {
                                dataPointID: this.renderer.state.id,
                                changes: {order_line: {operation: "UPDATE", id: line.id, data: {[ev.data.fieldName]: ev.data.value}}},
                            });
                        });
                    },
                });
            }
        },

        _isEqualValue (type, fieldName, orderLines) {
            let isEqualValue;
            let secondValue = orderLines[1].data[fieldName];
            if (type === 'normal') {
                if (secondValue instanceof moment) {
                    isEqualValue = orderLines.slice(1).every(line => secondValue.isSame(line.data[fieldName]));
                } else {
                    isEqualValue = orderLines.slice(1).every(line => line.data[fieldName] === secondValue);
                }
            } else if (type === 'one2many') {
                // only works for display_name because we want to be able to apply different id with similar properties
                if (secondValue.data && secondValue.data.display_name) {
                    secondValue = secondValue.data.display_name;
                    isEqualValue = orderLines.slice(1).every(line => line.data[fieldName].data && line.data[fieldName].data.display_name === secondValue);
                } else {
                    isEqualValue = orderLines.slice(1).every(line => line.data[fieldName] === secondValue);
                }
            }
            return isEqualValue;
        },

        _DialogReady (ev, type) {
            const recordData = ev.target.recordData;
            const fieldName = ev.data.fieldName;
            const orderLines = this.renderer.state.data.order_line.data.filter(line => !line.data.display_type);
            if (orderLines.length < 3) {
                return false;
            }
            if (recordData.id === orderLines[0].data.id && this._isEqualValue(type, fieldName, orderLines)) {
               return orderLines;
            }
            return false;
        },

    });

    const SaleOrderView = FormView.extend({
        config: _.extend({}, FormView.prototype.config, {
            Controller: SaleOrderFormController,
        }),
    });

    viewRegistry.add('sale_discount_form', SaleOrderView);

    return SaleOrderView;

});
