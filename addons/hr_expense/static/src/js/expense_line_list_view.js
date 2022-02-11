odoo.define('hr_expense.ExpenseLineListChatter', function (require) {
"use strict";

    var ListRenderer = require('web.ListRenderer');
    var FieldOne2Many = require('web.relational_fields').FieldOne2Many;
    var field_registry = require('web.field_registry');
    var config = require('web.config');
    var ListController = require('web.ListController');

    
    // How can I register this thingy? It won't run will it?
    var ExpenseListController = ListController.extend({

        custom_events: _.extend({}, ListRenderer.prototype.custom_events, {
            row_selected: '_onRowSelected',
        }),

        _onRowSelected: function (ev) {
            if (config.device.size_class >= config.device.SIZES.XXL) {
                this.last_selected = ev.data.recordId;
                console.log('_onRowSelected  xxx')
                //if (this.last_selected.includes('line')) { // if it comes from _onToggleGroup, this._update is triggered but not if it comes from _selectRow
                //    this._renderAttachmentPreview(ev.data.recordId);
                //}
                this._renderAttachmentPreview(ev.data.recordId);
            }
        },

        _renderAttachmentPreview: function (recordId) {
            var self = this;


            console.log('_renderAttachmentPreview ...')

            if (!recordId) {
                return Promise.resolve()
            }
            
          //var record = this.model.get(recordId || this.last_selected);
            console.log('this.model ...', this.model)
        },
        
    });
    
    
    
    var ExpenseLineListRenderer = ListRenderer.extend({

        /*
         * @override
         */
        _onRowClicked: function (ev) {
            ev.stopPropagation();
            console.log('We clicked the row 123')
            // can we get record here
            var id = $(ev.currentTarget).data('id');
            if (id) {
                this.trigger_up('row_selected', {
                    recordId: id,
                });
            }
            return this._super.apply(this, arguments);
        },
    

    });

    var FieldExpenseLines = FieldOne2Many.extend({
        _getRenderer: function () {
            return ExpenseLineListRenderer;
        },

    });

    field_registry.add('hr_expense_lines', FieldExpenseLines);
});