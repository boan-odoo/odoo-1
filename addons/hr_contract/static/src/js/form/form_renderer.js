/** @odoo-module **/

import FormRenderer from 'web.FormRenderer';

export default FormRenderer.extend({
    _updateView($newContent) {
        this._super(...arguments);
        this.getSession().user_has_group('hr_contract.group_hr_contract_manager').then((has_group) => {
            if (!has_group) {
                this.$el.find('.o_ChatterTopbar_buttonScheduleActivity').remove();
            }
        });
    },
});
