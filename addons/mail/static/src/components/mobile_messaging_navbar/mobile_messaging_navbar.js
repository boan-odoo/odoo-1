/** @odoo-module **/

import { registerMessagingComponent } from '@mail/utils/messaging_component';
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

export class MobileMessagingNavbar extends LegacyComponent {

    /**
     * @returns {MobileMessagingNavbarView}
     */
    get mobileMessagingNavbarView() {
        return this.messaging && this.messaging.models['MobileMessagingNavbarView'].get(this.props.localId);
    }

}

Object.assign(MobileMessagingNavbar, {
    props: { localId: String },
    template: 'mail.MobileMessagingNavbar',
});

registerMessagingComponent(MobileMessagingNavbar);
