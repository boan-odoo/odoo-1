odoo.define('sale.UpdateAllLinesMixin', function (require) {
    'use strict';

    const OpenUpdateAllWizardMixin = {
      reset: function (record, ev) {
        console.log("reset", record, event);
        if (ev && ev.data.changes ) {
            this.trigger_up('open_update_line_wizard');
        }
        this._super(...arguments);
      },
    };
    return OpenUpdateAllWizardMixin;
});
