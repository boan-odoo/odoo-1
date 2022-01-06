/** @odoo-module **/

import { ModelManager } from '@mail/model/model_manager';

export const messagingService = {
    dependencies: ['user', 'localization', 'orm', 'rpc', 'router', 'effect', 'ui'],

    start(env) {
        this.modelManager = new ModelManager(env);
        this.modelManager.start(this.messagingValues);

        return {
            /**
             * Returns the messaging record once it is initialized. This method
             * should be considered the main entry point to the messaging system
             * for outside code.
             *
             * @returns {mail.messaging}
             **/
            async get() {
                return this.modelManager.getMessaging();
            },
            modelManager: this.modelManager,
        }
    },
};
