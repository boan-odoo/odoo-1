/** @odoo-module **/

import ActivityView from '@mail/js/views/activity/activity_view';
import HrContractActivityRenderer from './activity_renderer';
import viewRegistry from 'web.view_registry';

export const HrContractActivityView = ActivityView.extend({
    config: Object.assign({}, ActivityView.prototype.config, {
        Renderer: HrContractActivityRenderer,
    }),
});

viewRegistry.add('hr_contract_activity', HrContractActivityView);

