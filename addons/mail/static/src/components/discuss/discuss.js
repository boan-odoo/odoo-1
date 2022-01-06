/** @odoo-module **/

import { useUpdate } from '@mail/component_hooks/use_update/use_update';
import { registerMessagingComponent } from '@mail/utils/messaging_component';

const { Component } = owl;

export class Discuss extends Component {

    /**
     * @override
     */
    setup() {
        super.setup();
        this._updateLocalStoreProps();
        // bind since passed as props
        this._onMobileAddItemHeaderInputSelect = this._onMobileAddItemHeaderInputSelect.bind(this);
        this._onMobileAddItemHeaderInputSource = this._onMobileAddItemHeaderInputSource.bind(this);
        useUpdate({ func: () => this._update() });
        this._onHideMobileAddItemHeader = this._onHideMobileAddItemHeader.bind(this);
        this.discuss.update({ initActiveId: this.props.actionId });
    }

    _update() {
        if (!this.discussView) {
            return;
        }
        if (this.discussView.discuss.thread) {
            this.env.services.router.pushState({
                action: this.props.actionId,
                active_id: this.discuss.activeId,
            });
        } else if (!this._activeThreadCache) {
            this.discussView.discuss.openInitThread();
        }
        if (
            this.discussView.discuss.thread &&
            this.discussView.discuss.thread === this.messaging.inbox &&
            this.discussView.discuss.threadView &&
            this._lastThreadCache === this.discussView.discuss.threadView.threadCache.localId &&
            this._lastThreadCounter > 0 && this.discussView.discuss.thread.counter === 0
        ) {
            this.env.services.effect.add({
                message: this.env._t("Congratulations, your inbox is empty!"),
            });
        }
        this._activeThreadCache = this.discussView.discuss.threadView && this.discussView.discuss.threadView.threadCache;
        this._updateLocalStoreProps();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @returns {string}
     */
    get addChannelInputPlaceholder() {
        return this.env._t("Create or search channel...");
    }

    /**
     * @returns {string}
     */
    get addChatInputPlaceholder() {
        return this.env._t("Search user...");
    }

    /**
     * @returns {DiscussView}
     */
    get discussView() {
        return this.messaging && this.messaging.models['DiscussView'].get(this.props.localId);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _updateLocalStoreProps() {
        if (!this.discussView) {
            return;
        }
        /**
         * Locally tracked store props `activeThreadCache`.
         * Useful to set scroll position from last stored one and to display
         * rainbox man on inbox.
         */
        this._lastThreadCache = (
            this.discussView.discuss.threadView &&
            this.discussView.discuss.threadView.threadCache &&
            this.discussView.discuss.threadView.threadCache.localId
        );
        /**
         * Locally tracked store props `threadCounter`.
         * Useful to display the rainbow man on inbox.
         */
        this._lastThreadCounter = (
            this.discussView.discuss.thread &&
            this.discussView.discuss.thread.counter
        );
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _onHideMobileAddItemHeader() {
        if (!this.discussView) {
            return;
        }
        this.discussView.discuss.clearIsAddingItem();
    }

    /**
     * @private
     * @param {Event} ev
     * @param {Object} ui
     * @param {Object} ui.item
     * @param {integer} ui.item.id
     */
    _onMobileAddItemHeaderInputSelect(ev, ui) {
        if (!this.discussView) {
            return;
        }
        const discuss = this.discussView.discuss;
        if (discuss.isAddingChannel) {
            discuss.handleAddChannelAutocompleteSelect(ev, ui);
        } else {
            discuss.handleAddChatAutocompleteSelect(ev, ui);
        }
    }

    /**
     * @private
     * @param {Object} req
     * @param {string} req.term
     * @param {function} res
     */
    _onMobileAddItemHeaderInputSource(req, res) {
        if (!this.discussView) {
            return;
        }
        if (this.discussView.discuss.isAddingChannel) {
            this.discussView.discuss.handleAddChannelAutocompleteSource(req, res);
        } else {
            this.discussView.discuss.handleAddChatAutocompleteSource(req, res);
        }
    }

}

Object.assign(Discuss, {
    props: {
        action: Object,
        actionId: Number,
        globalState: { type: Object, optional: 1 },
    },
    template: 'mail.Discuss',
});

registerMessagingComponent(Discuss);
