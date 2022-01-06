/** @odoo-module **/

import { useModels } from "@mail/component_hooks/use_models/use_models";
import { getMessagingComponent } from "@mail/utils/messaging_component";

const { Component } = owl;

export class RtcActivityNoticeContainer extends Component {

    /**
     * @override
     */
    setup() {
        useModels();
        super.setup();
    }

}

Object.assign(RtcActivityNoticeContainer, {
    components: { RtcActivityNotice: getMessagingComponent('RtcActivityNotice') },
    template: 'mail.RtcActivityNoticeContainer',
});
