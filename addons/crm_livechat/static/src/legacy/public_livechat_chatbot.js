odoo.define('im_livechat.legacy.crm_livechat_chatbot.im_livechat', function (require) {
"use strict";

const LivechatButton = require('im_livechat.legacy.im_livechat.im_livechat').LivechatButton;


LivechatButton.include({

    /**
     * @override
     */
    _isExpectingUserInput: function (step) {
        return (step === 'create_lead') ? false : this._super.apply(this, arguments);
    },

});

return LivechatButton;

});
