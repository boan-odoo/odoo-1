/** @odoo-module **/

import { Discuss } from '@discuss/components/discuss/discuss';
import InvitePartnerDialog from '@discuss/widgets/discuss_invite_partner_dialog/discuss_invite_partner_dialog';

import AbstractAction from 'web.AbstractAction';
import { action_registry, qweb } from 'web.core';

const { Component } = owl;

const components = { Discuss };

const DiscussWidget = AbstractAction.extend({
    template: 'discuss.widgets.Discuss',
    hasControlPanel: true,
    loadControlPanel: true,
    withSearchBar: true,
    searchMenuTypes: ['filter', 'favorite'],
    /**
     * @override {web.AbstractAction}
     * @param {web.ActionManager} parent
     * @param {Object} action
     * @param {Object} [action.context]
     * @param {string} [action.context.active_id]
     * @param {Object} [action.params]
     * @param {string} [action.params.default_active_id]
     * @param {Object} [options={}]
     */
    init(parent, action, options = {}) {
        this._super(...arguments);

        // render buttons in control panel
        this.$buttons = $(qweb.render('discuss.widgets.Discuss.DiscussControlButtons'));
        this.$buttons.find('button').css({ display: 'inline-block' });
        this.$buttons.on('click', '.o_invite', ev => this._onClickInvite(ev));
        this.$buttons.on('click', '.o_widget_Discuss_controlPanelButtonMarkAllRead',
            ev => this._onClickMarkAllAsRead(ev)
        );
        this.$buttons.on('click', '.o_mobile_new_channel', ev => this._onClickMobileNewChannel(ev));
        this.$buttons.on('click', '.o_mobile_new_message', ev => this._onClickMobileNewMessage(ev));
        this.$buttons.on('click', '.o_unstar_all', ev => this._onClickUnstarAll(ev));

        // control panel attributes
        this.action = action;
        this.actionManager = parent;
        this.searchModelConfig.modelName = 'discuss.channel.message';
        this.discuss = undefined;
        this.options = options;

        this.component = undefined;

        this._lastPushStateActiveThread = null;
    },
    /**
     * @override
     */
    async willStart() {
        await this._super(...arguments);
        this.env = Component.env;
        await this.env.messagingCreatedPromise;
        const initActiveId = this.options.active_id ||
            (this.action.context && this.action.context.active_id) ||
            (this.action.params && this.action.params.default_active_id) ||
            'discuss.box_inbox';
        this.discuss = this.env.messaging.discuss;
        this.discuss.update({ initActiveId });
    },
    /**
     * @override {web.AbstractAction}
     */
    destroy() {
        if (this.component) {
            this.component.destroy();
            this.component = undefined;
        }
        if (this.$buttons) {
            this.$buttons.off().remove();
        }
        this._super(...arguments);
    },
    /**
     * @override {web.AbstractAction}
     */
    on_attach_callback() {
        this._super(...arguments);
        if (this.component) {
            // prevent twice call to on_attach_callback (FIXME)
            return;
        }
        const DiscussComponent = components.Discuss;
        this.component = new DiscussComponent();
        this._pushStateActionManagerEventListener = ev => {
            ev.stopPropagation();
            if (this._lastPushStateActiveThread === this.discuss.channel) {
                return;
            }
            this._pushStateActionManager();
            this._lastPushStateActiveThread = this.discuss.channel;
        };
        this._showRainbowManEventListener = ev => {
            ev.stopPropagation();
            this._showRainbowMan();
        };
        this._updateControlPanelEventListener = ev => {
            ev.stopPropagation();
            this._updateControlPanel();
        };

        this.el.addEventListener(
            'o-push-state-action-manager',
            this._pushStateActionManagerEventListener
        );
        this.el.addEventListener(
            'o-show-rainbow-man',
            this._showRainbowManEventListener
        );
        this.el.addEventListener(
            'o-update-control-panel',
            this._updateControlPanelEventListener
        );
        return this.component.mount(this.el);
    },
    /**
     * @override {web.AbstractAction}
     */
    on_detach_callback() {
        this._super(...arguments);
        if (this.component) {
            this.component.destroy();
        }
        this.component = undefined;
        this.el.removeEventListener(
            'o-push-state-action-manager',
            this._pushStateActionManagerEventListener
        );
        this.el.removeEventListener(
            'o-show-rainbow-man',
            this._showRainbowManEventListener
        );
        this.el.removeEventListener(
            'o-update-control-panel',
            this._updateControlPanelEventListener
        );
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _pushStateActionManager() {
        this.actionManager.do_push_state({
            action: this.action.id,
            active_id: this.discuss.activeId,
        });
    },
    /**
     * @private
     * @returns {boolean}
     */
    _shouldHaveInviteButton() {
        return (
            this.discuss.channel &&
            this.discuss.channel.channel_type === 'channel'
        );
    },
    /**
     * @private
     */
    _showRainbowMan() {
        this.trigger_up('show_effect', {
            message: this.env._t("Congratulations, your inbox is empty!"),
            type: 'rainbow_man',
        });
    },
    /**
     * @private
     */
    _updateControlPanel() {
        // Invite
        if (this._shouldHaveInviteButton()) {
            this.$buttons.find('.o_invite').removeClass('o_hidden');
        } else {
            this.$buttons.find('.o_invite').addClass('o_hidden');
        }
        // Mark All Read
        if (
            this.discuss.channelView &&
            this.discuss.channel &&
            this.discuss.channel === this.env.messaging.inbox
        ) {
            this.$buttons
                .find('.o_widget_Discuss_controlPanelButtonMarkAllRead')
                .removeClass('o_hidden')
                .prop('disabled', this.discuss.channelView.messages.length === 0);
        } else {
            this.$buttons
                .find('.o_widget_Discuss_controlPanelButtonMarkAllRead')
                .addClass('o_hidden');
        }
        // Unstar All
        if (
            this.discuss.channelView &&
            this.discuss.channel &&
            this.discuss.channel === this.env.messaging.starred
        ) {
            this.$buttons
                .find('.o_unstar_all')
                .removeClass('o_hidden')
                .prop('disabled', this.discuss.channelView.messages.length === 0);
        } else {
            this.$buttons
                .find('.o_unstar_all')
                .addClass('o_hidden');
        }
        // Mobile: Add channel
        if (
            this.env.messaging.device.isMobile &&
            this.discuss.activeMobileNavbarTabId === 'channel'
        ) {
            this.$buttons
                .find('.o_mobile_new_channel')
                .removeClass('o_hidden');
        } else {
            this.$buttons
                .find('.o_mobile_new_channel')
                .addClass('o_hidden');
        }
        // Mobile: Add message
        if (
            this.env.messaging.device.isMobile &&
            this.discuss.activeMobileNavbarTabId === 'chat'
        ) {
            this.$buttons
                .find('.o_mobile_new_message')
                .removeClass('o_hidden');
        } else {
            this.$buttons
                .find('.o_mobile_new_message')
                .addClass('o_hidden');
        }

        let title;
        if (this.env.messaging.device.isMobile || !this.discuss.channel) {
            title = this.env._t("Discuss");
        } else {
            const prefix =
                this.discuss.channel.channel_type === 'channel' &&
                this.discuss.channel.public !== 'private'
                ? '#'
                : '';
            title = `${prefix}${this.discuss.channel.displayName}`;
        }

        this.updateControlPanel({
            cp_content: {
                $buttons: this.$buttons,
            },
            title,
        });
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _onClickInvite() {
        new InvitePartnerDialog(this, {
            activeChannelLocalId: this.discuss.channel.localId,
            messagingEnv: this.env,
        }).open();
    },
    /**
     * @private
     */
    _onClickMarkAllAsRead() {
        this.env.models['discuss.channel.message'].markAllAsRead(this.domain);
    },
    /**
     * @private
     */
    _onClickMobileNewChannel() {
        this.discuss.update({ isAddingChannel: true });
    },
    /**
     * @private
     */
    _onClickMobileNewMessage() {
        this.discuss.update({ isAddingChat: true });
    },
    _onClickUnstarAll() {
        this.env.models['discuss.channel.message'].unstarAll();
    },
    /**
     * @private
     * @param {Object} searchQuery
     */
    _onSearch: function (searchQuery) {
        this.discuss.update({
            stringifiedDomain: JSON.stringify(searchQuery.domain),
        });
    },
});

action_registry.add('discuss.widgets.discuss', DiscussWidget);

export default DiscussWidget;
