odoo.define('sale.UpdateAllLinesMixin', function (require) {
    'use strict';

    const OpenUpdateAllWizardMixin = {
        reset: function (record, ev) {
            if (ev && ev.data.changes) {
                const fieldName = Object.keys(ev.data.changes)[0];
                const plop = this._getUpdateAllFields();
                const ValidField =  this._getUpdateAllFields().includes(fieldName);
                if (ValidField) {
                    this.trigger_up('open_update_line_wizard', {fieldName: fieldName});
                }
            }
            this._super(...arguments);
        },

        _getUpdateAllFields: function () {
            return [];
        },
    };
    return OpenUpdateAllWizardMixin;
});
