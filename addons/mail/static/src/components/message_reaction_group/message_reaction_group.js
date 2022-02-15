/** @odoo-module **/

import { registerMessagingComponent } from '@mail/utils/messaging_component';
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

export class MessageReactionGroup extends LegacyComponent {

    get messageReactionGroup() {
        return this.messaging.models['MessageReactionGroup'].get(this.props.localId);
    }

}

Object.assign(MessageReactionGroup, {
    props: { localId: String },
    template: 'mail.MessageReactionGroup',
});

registerMessagingComponent(MessageReactionGroup);
