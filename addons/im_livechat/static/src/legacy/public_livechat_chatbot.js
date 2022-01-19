odoo.define('im_livechat.legacy.im_livechat_chatbot.im_livechat', function (require) {
"use strict";

var core = require('web.core');
var session = require('web.session');
var time = require('web.time');

const LivechatButton = require('im_livechat.legacy.im_livechat.im_livechat').LivechatButton;

var _t = core._t;

/**
 * Override of the LivechatButton to include chatbot capabilities.
 * Main changes / hooking points are:
 * - Show a custom welcome message that is in fact the first message of the chatbot script
 * - When messages are rendered, add click handles to chatbot options
 * - When the user picks an option or answers to the chatbot, display a "chatbot is typing..."
 *   message for a couple seconds and then trigger the next step of the script
 */
LivechatButton.include({
    async willStart() {
        return this._super(...arguments).then(() => {
            if (this._rule) {
                this._isChatbot = this._rule.action === 'use_chatbot';
                this._chatbotCurrentStep = this._rule.chatbot.chatbot_step;

                return Promise.resolve();
            }
        });
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _chatbotEnableInput: function () {
        this._chatWindow.$('.o_composer_text_field')
            .prop('disabled', false)
            .removeClass('text-center font-italic bg-200')
            .val('');
    },
    /**
     * @private
     */
    _chatbotDisableInput: function (disableText) {
        this._chatWindow.$('.o_composer_text_field')
            .prop('disabled', true)
            .addClass('text-center font-italic bg-200')
            .val(disableText);
    },
    /**
     * @private
     */
     _chatbotTriggerNextStep: async function () {
         let result = await session.rpc('/im_livechat/chatbot_trigger_step', {
            channel_uuid: this._livechat.getUUID()
         });

         if (result) {
            this._chatbotCurrentStep = result;

            if (this._chatbotCurrentStep.chatbot_step_type === 'text'
                && !this._chatbotCurrentStep.chatbot_step_is_last) {
                setTimeout(this._chatbotTriggerNextStep.bind(this), 2000);
            } else {
                this._chatbotEnableInput();
            }
         } else {
            this._chatbotEnableInput();
         }
     },

    /**
     * @private
     */
     _isAutoPopup: function () {
        return ['auto_popup', 'use_chatbot'].includes(this._rule.action);
    },
    /**
     * @private
     */
    _prepareGetSessionParameters: function () {
        const parameters = this._super(...arguments);
        parameters.chatbot_id = this._rule.chatbot.chatbot_id;
        return parameters;
    },
    /**
     * @private
     */
    _renderMessages: function () {
        this._super(...arguments);

        var self = this;
        this._chatWindow.$('.o_thread_message:last .o_livechat_chatbot_options li').each(function () {
            $(this).on('click', self._onChatbotOptionClicked.bind(self));
        });

        if (this._messages.length !== 0) {
            const lastMessage = this._messages[this._messages.length - 1];
            const stepAnswers = lastMessage.getChatbotStepAnswers();
            if (stepAnswers && stepAnswers.length !== 0 && !lastMessage.getChatbotStepAnswerId()) {
                this._chatbotDisableInput(_t('Please select an option here above'));
            }
        }
    },
    /**
     * @private
     */
    _sendMessage: function (message, additionalParameters=false) {
        if (this._isChatbot && this._chatbotCurrentStep && !this._chatbotCurrentStep.chatbot_step_is_last) {
            this._chatbotDisableInput(
                _.str.sprintf(_t('%s is typing...'), this._rule.chatbot.chatbot_name));

            setTimeout(this._chatbotTriggerNextStep.bind(this), 2000);
        }

        return this._super(...arguments);
    },
    /**
     * @private
     */
    _sendWelcomeMessage: function () {
        if (this._isChatbot) {
            this._addMessage({
                id: '_welcome',
                attachment_ids: [],
                author_id: this._livechat.getOperatorPID(),
                body: this._rule.chatbot.chatbot_step.chatbot_step_message,
                chatbot_step_answers: this._rule.chatbot.chatbot_step.chatbot_step_answers,
                date: time.datetime_to_str(new Date()),
                model: "mail.channel",
                res_id: this._livechat.getID(),
            }, { prepend: true });
        } else {
            this._super(...arguments);
        }
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     *
     * @param {MouseEvent} ev
     */
    _onChatbotOptionClicked: function (ev) {
        ev.stopPropagation();

        const $target = $(ev.currentTarget);
        const stepId = $target.closest('ul').data('chatbotStepId');
        this._messages.forEach((message) => {
            if (message.getChatbotStepId() === stepId) {
                message.setChatbotStepAnswerId($target.data('chatbotStepAnswerId'));
            }
        });

        this._sendMessage({
            content: $target.text().trim()
        }, {wrap_chatbot_answer: true});
    },
});

return LivechatButton;

});

odoo.define('im_livechat.legacy.im_livechat_chatbot.model.WebsiteLivechatChatbotMessage', function (require) {

const WebsiteLivechatMessage = require('im_livechat.legacy.im_livechat.model.WebsiteLivechatMessage');

/**
 * Override of the WebsiteLivechatMessage that includes chatbot capabilities.
 * The main changes are:
 * - Allow to display options for the end-user to click on ("_chatbotStepAnswers")
 * - Show a different name/icon for the chatbot (instead of the 'OdooBot' operator name/icon)
 */
WebsiteLivechatMessage.include({
    /**
     * @param {im_livechat.legacy.im_livechat.im_livechat.LivechatButton} parent
     * @param {Object} data
     * @param {Object} options
     * @param {string} options.default_username
     * @param {string} options.serverURL
     */
    init: function (parent, data, options) {
        this._super(...arguments);

        if (parent._isChatbot) {
            this._chatbotId = parent._rule.chatbot.chatbot_id;
            this._chatbotName = parent._rule.chatbot.chatbot_name;
            this._chatbotOperatorId = parent._rule.chatbot.chatbot_operator_id;

            this._chatbotStepId = data.chatbot_script_step_id;
            this._chatbotStepAnswers = data.chatbot_step_answers;
            this._chatbotStepAnswerId = data.chatbot_script_step_answer_id;
        }
    },

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    getAvatarSource: function () {
        var source = this._serverURL;

        if (this.isAuthorChatbot()) {
            source += '/web/image/im_livechat.chatbot.script/' + this._chatbotId + '/image_128';
            return source;
        } else {
            return this._super(...arguments);
        }
    },
    /**
     * Builds the display class for this chatbot answer
     *
     * @return {string}
     */
    getChatbotAnswerClass: function (stepAnswer) {
        var classes = [];
        if (this.getChatbotStepAnswerId()) {
            if (this.getChatbotStepAnswerId() === stepAnswer.id) {
                classes = ['bg-primary', 'disabled'];
            } else {
                classes = ['bg-200', 'disabled'];
            }
        } else {
            classes = ['bg-200'];
        }

        return classes.join(' ');
    },
    /**
     * Get chat bot script step ID
     *
     * @return {string}
     */
    getChatbotStepId: function () {
        return this._chatbotStepId;
    },
    /**
     * Get chat bot script answers
     *
     * @return {string}
     */
    getChatbotStepAnswers: function () {
        return this._chatbotStepAnswers;
    },
    /**
     * Get chat bot script answer ID
     *
     * @return {string}
     */
    getChatbotStepAnswerId: function () {
        return this._chatbotStepAnswerId;
    },
    /**
     * @override
     */
    getDisplayedAuthor: function () {
        if (this.isAuthorChatbot()) {
            return this._chatbotName;
        } else {
            return this._super(...arguments);
        }
    },
    isAuthorChatbot: function () {
        return this.hasAuthor() && this.getAuthorID() === this._chatbotOperatorId;
    },
    setChatbotStepAnswerId: function (chatbotStepAnswerId) {
        this._chatbotStepAnswerId = chatbotStepAnswerId;
    }
});

return WebsiteLivechatMessage;

});
