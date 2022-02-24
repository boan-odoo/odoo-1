odoo.define('im_livechat.legacy.im_livechat_chatbot.im_livechat', function (require) {
"use strict";

var core = require('web.core');
var localStorage = require('web.local_storage');
var session = require('web.session');
var time = require('web.time');
var utils = require('web.utils');

const LivechatButton = require('im_livechat.legacy.im_livechat.im_livechat').LivechatButton;

var _t = core._t;
var QWeb = core.qweb;

/**
 * Override of the LivechatButton to include chatbot capabilities.
 * Main changes / hooking points are:
 * - Show a custom welcome message that is in fact the first message of the chatbot script
 * - When messages are rendered, add click handles to chatbot options
 * - When the user picks an option or answers to the chatbot, display a "chatbot is typing..."
 *   message for a couple seconds and then trigger the next step of the script
 */
LivechatButton.include({
    init: function () {
        this._super(...arguments);

        this._chatbotMessageDelay = 3500;
    },

    /**
     * This override handles the following use cases:
     *
     * - If the chat is started for the first time (first visit of a visitor)
     *   We register the chatbot configuration and the rest of the behavior is triggered by various
     *   method overrides ('sendWelcomeMessage', 'sendMessage', ...)
     *
     * - If the chat has been started before, but the user did not interact with the bot
     *   The default behavior is to open an empty chat window, without any messages.
     *   In addition, we fetch the configuration (with a '/init' call), to see if we have a bot
     *   configured.
     *   Indeed we want to trigger the bot script on every page where the associated rule is matched.
     *
     * - If we have a non-empty chat history, resume the chat script where the end-user left it by
     *   fetching the necessary information from the local storage.
     *
     * @override
     */
    async willStart() {
        return this._super(...arguments).then(async () => {
            if (this._rule) {
                this._isChatbot = this._rule.action === 'use_chatbot';
                this._chatbot = this._rule.chatbot;
                return Promise.resolve();
            } else if (this._history !== null && this._history.length === 0) {
                const result = await session.rpc('/im_livechat/init', {channel_id: this.options.channel_id});

                if (result.rule.action === 'use_chatbot') {
                    // remove cookie to force opening the popup again
                    utils.set_cookie('im_livechat_auto_popup', '', -1);
                    this._history = null;
                    this._rule = result.rule;
                    this._chatbot = result.rule.chatbot;
                    this._isChatbot = true;
                    this._chatbotBatchWelcomeMessages = true;  // see '_sendWelcomeChatbotMessage'
                }
                return Promise.resolve();
            } else if (this._history !== null && this._history.length !== 0) {
                const sessionCookie = utils.get_cookie('im_livechat_session');
                if (sessionCookie) {
                    this._chatbotRestoreSession(sessionCookie);
                }
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
     * Once the script ends, adds a visual element at the end of the chat window allowing to restart
     * the whole script.
     *
     * @private
     */
    _chatbotEndScript: function () {
        this._chatWindow.$('.o_composer_text_field').addClass('d-none');
        this._chatWindow.$('.o_livechat_chatbot_end').removeClass('d-none');
        this._chatWindow.$('.o_livechat_chatbot_restart').one('click',
            this._onChatbotRestartScript.bind(this));

    },
    /**
     * Disable the input allowing the user to type.
     * This is typically used when we want to force him to click on one of the chatbot options.
     *
     * @private
     */
    _chatbotDisableInput: function (disableText) {
        this._chatWindow.$('.o_composer_text_field')
            .prop('disabled', true)
            .addClass('text-center font-italic bg-200')
            .val(disableText);
    },
    /**
     * Adds a small "is typing" animation into the chat window.
     *
     * @private
     */
    _chatbotSetIsTyping: function (isWelcomeMessage=false) {
        this._chatbotDisableInput('');

        setTimeout(() => {
            this._chatWindow.$('.o_mail_thread_content').append(
                $(QWeb.render('im_livechat.legacy.chatbot.is_typing_message', {
                    'chatbotImageSrc': `/web/image/im_livechat.chatbot.script/${this._chatbot.chatbot_id}/image_128`,
                    'chatbotName': this._chatbot.chatbot_name,
                    'isWelcomeMessage': isWelcomeMessage
                }))
            );

            this._chatWindow.scrollToBottom();
        }, this._chatbotMessageDelay / 3);
    },
    /**
     * @private
     */
     _chatbotRestoreSession: function (sessionCookie) {
        let chatbotState = localStorage.getItem(
            'im_livechat.chatbot.state.uuid_' + JSON.parse(sessionCookie).uuid);

        if (chatbotState) {
            chatbotState = JSON.parse(chatbotState);
            this._isChatbot = true;
            this._chatbot = chatbotState._chatbot;
            this._chatbotCurrentStep = chatbotState._chatbotCurrentStep;
        }
     },
    /**
     * Triggers the next step of the script by calling the associated route.
     * This will receive the next step and act accordingly:
     *
     * - If we are on the last step of the script
     *   -> end it (display a custom message and disable input)
     *
     * - If the received step is of type "text"
     *   -> trigger the next step after a delay.
     *
     * - Otherwise
     *   -> Enable the input and let the user type
     *
     * @private
     */
    _isExpectingUserInput: function (step) {
        return step !== 'text';
    },
    /**
     * @private
     */
     _chatbotTriggerNextStep: async function () {
         let result = await session.rpc('/im_livechat/chatbot_trigger_step', {
            channel_uuid: this._livechat.getUUID(),
            chatbot_id: this._chatbot.chatbot_id
         });

         if (result) {
            this._chatbotCurrentStep = result;

            if (!this._isExpectingUserInput(this._chatbotCurrentStep.chatbot_step_type)
                && this._chatbotCurrentStep.chatbot_step_is_last) {
                this._chatbotEndScript();
            } else if (!this._isExpectingUserInput(this._chatbotCurrentStep.chatbot_step_type)
                && !this._chatbotCurrentStep.chatbot_step_is_last) {
                this._chatbotSetIsTyping();
                setTimeout(this._chatbotTriggerNextStep.bind(this), this._chatbotMessageDelay);
            } else {
                this._chatbotEnableInput();
            }
         } else {
            this._chatbotEnableInput();
         }

         // register current state into localStorage to be able to resume
         // will not fully work if browser switch & we identify the same visitor... unlikely
         let chatUuid = this._livechat.toData().uuid;
         localStorage.setItem('im_livechat.chatbot.state.uuid_' + chatUuid, JSON.stringify({
             '_chatbot': this._chatbot,
             '_chatbotCurrentStep': this._chatbotCurrentStep
         }));

         return result;
     },
    /**
     * @private
     * @override
     */
     _isAutoPopup: function () {
        return ['auto_popup', 'use_chatbot'].includes(this._rule.action);
    },
    /**
     * Small override:
     * If we resume an existing chatbot script, check after opening the chat window if we are on
     * the last step, and "end script" if so.
     *
     * @private
     * @override
     */
    _openChatWindow: function () {
        return this._super(...arguments).then(() => {
            if (this._chatbotCurrentStep
                && this._chatbotCurrentStep.chatbot_step_type === 'text'
                && this._chatbotCurrentStep.chatbot_step_is_last) {
                this._chatbotEndScript();
            }
        });
    },
    /**
     * @private
     * @override
     */
    _prepareGetSessionParameters: function () {
        const parameters = this._super(...arguments);

        if (this._isChatbot) {
            parameters.chatbot_id = this._chatbot.chatbot_id;
        }

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
        if (this._isChatbot && this._chatbotCurrentStep) {
            if (!this._chatbotCurrentStep.chatbot_step_is_last) {
                this._chatbotSetIsTyping();
                setTimeout(this._chatbotTriggerNextStep.bind(this), this._chatbotMessageDelay);
            } else if (!this._chatbotCurrentStep.step_type === 'forward_operator') {
                this._chatbotEndScript();
            }
        }

        return this._super(...arguments);
    },
    /**
     * Small override to handle chatbot welcome message(s).
     * @private
     */
    _sendWelcomeMessage: function () {
        if (this._isChatbot) {
            let welcomeMessageDelay = this._chatbotMessageDelay;
            if (this._chatbotBatchWelcomeMessages) {
                welcomeMessageDelay = 0;
            }
            this._sendWelcomeChatbotMessage(0, welcomeMessageDelay);
        } else {
            this._super(...arguments);
        }
    },
    /**
     * The bot can say multiple messages in quick succession as "welcome messages".
     * (See im_livechat.chatbot.script_step#_filtered_welcome_steps() for more details).
     *
     * It is important that those messages are sent as "welcome messages", meaning manually added
     * within the template, without creating actual mail.messages in the mail.channel.
     *
     * Indeed, if the end-user never interacts with the bot, those empty mail.channels are deleted
     * by a garbage collector mechanism.
     *
     * About "welcomeMessageDelay":
     *
     * The first time we open the chat, we want to bot to slowly input those messages in one at a
     * time, with pauses during which the end-user sees ("The bot is typing...").
     *
     * However, if the user navigates within the website (meaning he has an opened mail.channel),
     * then we input all the welcome messages at once without pauses, to avoid having that annoying
     * slow effect on every page / refresh.
     *
     * @private
     */
    _sendWelcomeChatbotMessage: function (stepIndex, welcomeMessageDelay) {
        const chatbotStep = this._chatbot.chatbot_welcome_steps[stepIndex];
        this._chatbotCurrentStep = chatbotStep;

        this._addMessage({
            id: '_welcome_' + stepIndex,
            attachment_ids: [],
            author_id: this._livechat.getOperatorPID(),
            body: chatbotStep.chatbot_step_message,
            chatbot_step_answers: chatbotStep.chatbot_step_answers,
            date: time.datetime_to_str(new Date()),
            model: "mail.channel",
            message_type: "comment",
            res_id: this._livechat.getID(),
        });

        if (stepIndex + 1 < this._chatbot.chatbot_welcome_steps.length) {
            if (welcomeMessageDelay !== 0) {
                this._chatbotSetIsTyping(true);
            }

            setTimeout(() => {
                this._sendWelcomeChatbotMessage(stepIndex + 1);
                this._renderMessages();
            }, welcomeMessageDelay);
        }
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     *
     * @param {MouseEvent} ev
     * @private
     */
    _onChatbotRestartScript: async function (ev) {
        this._chatWindow.$('.o_composer_text_field').removeClass('d-none');
        this._chatWindow.$('.o_livechat_chatbot_end').addClass('d-none');

        await session.rpc('/im_livechat/chatbot_restart', {
            channel_uuid: this._livechat.getUUID(),
        });

        this._chatbotSetIsTyping();
        setTimeout(this._chatbotTriggerNextStep.bind(this), this._chatbotMessageDelay);
    },

    /**
     *
     * @param {MouseEvent} ev
     * @private
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
            this._chatbotId = parent._chatbot.chatbot_id;
            this._chatbotName = parent._chatbot.chatbot_name;

            this._chatbotStepId = data.chatbot_script_step_id;
            this._chatbotStepAnswers = data.chatbot_step_answers;
            this._chatbotStepAnswerId = data.chatbot_script_step_answer_id;
        }
    },

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

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
    setChatbotStepAnswerId: function (chatbotStepAnswerId) {
        this._chatbotStepAnswerId = chatbotStepAnswerId;
    }
});

return WebsiteLivechatMessage;

});
