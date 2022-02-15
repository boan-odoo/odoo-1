/** @odoo-module **/

import { registerMessagingComponent } from '@mail/utils/messaging_component';
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

class DiscussPublicView extends LegacyComponent {

    /**
     * @returns {DiscussPublicView}
     */
     get discussPublicView() {
        return this.messaging && this.messaging.models['DiscussPublicView'].get(this.props.localId);
    }
}

Object.assign(DiscussPublicView, {
    props: { localId: String },
    template: 'mail.DiscussPublicView',
});

registerMessagingComponent(DiscussPublicView);
