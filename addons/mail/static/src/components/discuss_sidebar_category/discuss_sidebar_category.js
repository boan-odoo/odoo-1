/** @odoo-module **/

import { registerMessagingComponent } from '@mail/utils/messaging_component';
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

export class DiscussSidebarCategory extends LegacyComponent {

    /**
     * @returns {DiscussSidebarCategory}
     */
    get category() {
        return this.messaging && this.messaging.models['DiscussSidebarCategory'].get(this.props.localId);
    }
}

Object.assign(DiscussSidebarCategory, {
    props: { localId: String },
    template: 'mail.DiscussSidebarCategory',
});

registerMessagingComponent(DiscussSidebarCategory);
