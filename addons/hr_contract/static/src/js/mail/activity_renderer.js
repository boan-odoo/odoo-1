/** @odoo-module **/

import ActivityRenderer from '@mail/js/views/activity/activity_renderer';

const { Component, onWillStart, useState, xml } = owl;

import session from 'web.session';

class HrContractEmployeeManagerActivityRenderer extends ActivityRenderer {}
HrContractEmployeeManagerActivityRenderer.template = 'hr_contract.ActivityRenderer';

class HrContractActivityRenderer extends Component {

    setup() {
        this.state = useState({ isManager: true });
        super.setup(...arguments);
        onWillStart(async () => {
            this.state.isManager = await session.user_has_group('hr_contract.group_hr_contract_manager');
        });
    }

    get activityView() {
        return this.state.isManager === true? ActivityRenderer : HrContractEmployeeManagerActivityRenderer;
    }
}

HrContractActivityRenderer.template = xml`<t t-component="activityView" t-props="props"/>`;

export default HrContractActivityRenderer;
