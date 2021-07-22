odoo.define('website_livechat/static/src/models/messaging_notification_handler/messaging_notification_handler.js', function (require) {
'use strict';

const { registerInstancePatchModel } = require('@discuss/model/model_core');

registerInstancePatchModel('mail.messaging_notification_handler', 'website_livechat/static/src/models/messaging_notification_handler/messaging_notification_handler.js', {

    //----------------------------------------------------------------------
    // Private
    //----------------------------------------------------------------------

    /**
     * @override
     */
    _handleNotificationPartner(data) {
        const { info } = data;
        if (info === 'send_chat_request') {
            this._handleNotificationPartnerChannel(data);
            const channel = this.env.models['mail.thread'].findFromIdentifyingData({
                id: data.id,
                model: 'mail.channel',
            });
            this.env.messaging.chatWindowManager.openThread(channel, {
                makeActive: true,
            });
            return;
        }
        return this._super(data);
    },
});

});
