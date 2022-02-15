/** @odoo-module **/

import { registerMessagingComponent } from '@mail/utils/messaging_component';
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

export class DiscussSidebarMailbox extends LegacyComponent {

    /**
     * @returns {Thread}
     */
    get mailbox() {
        return this.messaging.models['Thread'].get(this.props.threadLocalId);
    }

}

Object.assign(DiscussSidebarMailbox, {
    props: { threadLocalId: String },
    template: 'mail.DiscussSidebarMailbox',
});

registerMessagingComponent(DiscussSidebarMailbox);
