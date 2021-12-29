/** @odoo-module  */

import { patch } from 'web.utils';
import { formatMonetary } from '@web/fields/formatters';
import ProjectRightPanel from '@project/js/right_panel/project_right_panel';

patch(ProjectRightPanel.prototype, '@sale_project/right_panel/project_right_panel', {
    formatMonetary(value, options = {}) {
        if (value === 0) return '';
        return formatMonetary(value, {
            currencyId: this.state.data.currency_id,
            ...options,
        });
    },
});
