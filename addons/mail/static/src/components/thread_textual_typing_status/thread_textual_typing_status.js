/** @odoo-module **/

import { registerMessagingComponent } from '@mail/utils/messaging_component';
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

export class ThreadTextualTypingStatus extends LegacyComponent {

    /**
     * @returns {Thread}
     */
    get thread() {
        return this.messaging && this.messaging.models['Thread'].get(this.props.threadLocalId);
    }

}

Object.assign(ThreadTextualTypingStatus, {
    props: { threadLocalId: String },
    template: 'mail.ThreadTextualTypingStatus',
});

registerMessagingComponent(ThreadTextualTypingStatus);
