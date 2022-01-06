/** @odoo-module **/

import { addRecordMethods, patchRecordMethods } from '@mail/model/model_core';
import session from 'web.Session';

// ensure that the model definition is loaded before the patch
import '@mail/models/messaging_initializer/messaging_initializer';

addRecordMethods('MessagingInitializer', {
    /**
     * @private
     */
    async _initializeOdooBot() {
        const data = await this.async(() => this.env.services.orm.call(
            'mail.channel',
            'init_odoobot',
        ));
        if (!data) {
            return;
        }
        this.messaging.update({ odoobot_initialized: true });
    },
});

patchRecordMethods('MessagingInitializer', {
    /**
     *
     * @override
     */
    _init(data) {
        this._super(data);
        this.messaging.update({ odoobot_initialized: data.odoobot_initialized });
        if (!this.messaging.odoobot_initialized && !this.messaging.isCurrentUserGuest) {
            this._initializeOdooBot();
        }
    },
});
