/** @odoo-module **/

import { useModels } from "@mail/component_hooks/use_models/use_models";
import { getMessagingComponent } from "@mail/utils/messaging_component";

const { Component } = owl;

export class MessagingMenuContainer extends Component {

    /**
     * @override
     */
    setup() {
        useModels();
        super.setup();
    }

}

Object.assign(MessagingMenuContainer, {
    components: { MessagingMenu: getMessagingComponent('MessagingMenu') },
    template: 'mail.MessagingMenuContainer',
});
