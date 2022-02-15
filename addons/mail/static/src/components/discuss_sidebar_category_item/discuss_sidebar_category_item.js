/** @odoo-module **/

import { registerMessagingComponent } from '@mail/utils/messaging_component';
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

export class DiscussSidebarCategoryItem extends LegacyComponent {

    /**
     * @returns {DiscussSidebarCategoryItem}
     */
    get categoryItem() {
        return this.messaging.models['DiscussSidebarCategoryItem'].get(this.props.localId);
    }

}

Object.assign(DiscussSidebarCategoryItem, {
    props: { localId: String },
    template: 'mail.DiscussSidebarCategoryItem',
});

registerMessagingComponent(DiscussSidebarCategoryItem);
