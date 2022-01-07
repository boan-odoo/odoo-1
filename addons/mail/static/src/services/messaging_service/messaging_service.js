/** @odoo-module **/

import { ModelManager } from '@mail/model/model_manager';

export const messagingService = {
    dependencies: ['user', 'localization', 'orm', 'rpc', 'router', 'effect', 'ui'],
    messagingValues: {},

    start(env) {
        const modelManager = new ModelManager(env);
        env.bus.on('WEB_CLIENT_READY', null, () => this._startModelManager(modelManager));

        return {
            /**
             * Returns the messaging record once it is initialized. This method
             * should be considered the main entry point to the messaging system
             * for outside code.
             *
             * @returns {mail.messaging}
             **/
            async get() {
                return modelManager.getMessaging();
            },
            modelManager: modelManager,
        };
    },
    /**
     * Separate method to control creation delay in tests.
     *
     * @private
     */
    _startModelManager(modelManager) {
        modelManager.start(this.messagingValues);
    },
};
