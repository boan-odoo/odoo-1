/** @odoo-module **/

import { useModels } from "@mail/component_hooks/use_models/use_models";
import { useUpdate } from '@mail/component_hooks/use_update/use_update';
import { getMessagingComponent } from "@mail/utils/messaging_component";

const { Component, onWillUnmount } = owl;

export class DiscussContainer extends Component {

    /**
     * @override
     */
    setup() {
        useModels();
        super.setup();
        useUpdate({ func: () => this._update() });
        onWillUnmount(() => this._willUnmount());
    }

    _update() {
        if (!this.messaging || !this.messaging.discuss) {
            return;
        }
        this.messaging.discuss.open();
    }

    _willUnmount() {
        if (this.messaging && this.messaging.discuss) {
            this.messaging.discuss.close();
        }
    }

}

Object.assign(DiscussContainer, {
    components: { Discuss: getMessagingComponent('Discuss') },
    template: 'mail.DiscussContainer',
});
