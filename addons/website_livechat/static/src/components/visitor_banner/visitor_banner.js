/** @odoo-module **/

import { registerMessagingComponent } from '@mail/utils/messaging_component';
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

class VisitorBanner extends LegacyComponent {

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @returns {Visitor}
     */
    get visitor() {
        return this.messaging && this.messaging.models['Visitor'].get(this.props.visitorLocalId);
    }

}

Object.assign(VisitorBanner, {
    props: {
        visitorLocalId: String,
    },
    template: 'website_livechat.VisitorBanner',
});

registerMessagingComponent(VisitorBanner);

export default VisitorBanner;
