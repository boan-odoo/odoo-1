/** @odoo-module **/

import { getMessagingComponent } from "@mail/utils/messaging_component";

import FormRenderer from 'web.FormRenderer';
import { ComponentWrapper } from 'web.OwlCompatibility';

const { Component } = owl;

class ChatterContainerWrapperComponent extends ComponentWrapper {}

/**
 * Include the FormRenderer to instantiate the chatter area containing (a
 * subset of) the mail widgets (mail_thread, mail_followers and mail_activity).
 */
FormRenderer.include({
    /**
     * @override
     */
    init(parent, state, params) {
        this._super(...arguments);
        this.chatterFields = params.chatterFields;
        this.mailFields = params.mailFields;
        this._chatterContainerComponent = undefined;
        /**
         * The target of chatter, if chatter has to be appended to the DOM.
         * This is set when arch contains `div.oe_chatter`.
         */
        this._chatterContainerTarget = undefined;
        /**
         * This jQuery element will be set when rendering the form view, and
         * used as a hook to insert the ChatterContainer in the right place,
         * when applying the rendering into the DOM.
         */
        this.$chatterContainerHook = undefined;
        // Do not load chatter in form view dialogs
        this._isFromFormViewDialog = params.isFromFormViewDialog;
    },
    /**
     * @override
     */
    destroy() {
        this._super(...arguments);
        this._chatterContainerComponent = undefined;
        this.off('o_attachments_changed', this);
        this.off('o_chatter_rendered', this);
        this.off('o_message_posted', this);
        Component.env.bus.off('Thread:promptAddFollower-closed', this);
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Returns whether the form renderer has a chatter to display or not.
     * This is based on arch, which should have `div.oe_chatter`.
     *
     * @private
     * @returns {boolean}
     */
    _hasChatter() {
        return !!this._chatterContainerTarget;
    },
    /**
     * @private
     */
    _makeChatterContainerComponent() {
        const props = this._makeChatterContainerProps();
        this._chatterContainerComponent = new ChatterContainerWrapperComponent(
            this,
            getMessagingComponent("ChatterContainer"),
            props
        );
        // Not in custom_events because other modules may remove this listener
        // while attempting to extend them.
        this.on('o_chatter_rendered', this, ev => this._onChatterRendered(ev));
        if (this.chatterFields.hasRecordReloadOnMessagePosted) {
            this.on('o_message_posted', this, ev => {
                this.trigger_up('reload', { keepChanges: true });
            });
        }
        if (this.chatterFields.hasRecordReloadOnAttachmentsChanged) {
            this.on('o_attachments_changed', this, ev => this.trigger_up('reload', { keepChanges: true }));
        }
        if (this.chatterFields.hasRecordReloadOnFollowersUpdate) {
            Component.env.bus.on('Thread:promptAddFollower-closed', this, ev => this.trigger_up('reload', { keepChanges: true }));
        }
    },
    /**
     * @private
     * @returns {Object}
     */
    _makeChatterContainerProps() {
        return {
            hasActivities: this.chatterFields.hasActivityIds,
            hasFollowers: this.chatterFields.hasMessageFollowerIds,
            hasMessageList: this.chatterFields.hasMessageIds,
            hasParentReloadOnAttachmentsChanged: this.chatterFields.hasRecordReloadOnAttachmentsChanged,
            isAttachmentBoxVisibleInitially: this.chatterFields.isAttachmentBoxVisibleInitially,
            threadId: this.state.res_id,
            threadModel: this.state.model,
        };
    },
    /**
     * Create the DOM element that will contain the chatter. This is made in
     * a separate method so it can be overridden (like in mail_enterprise for
     * example).
     *
     * @private
     * @returns {jQuery.Element}
     */
    _makeChatterContainerTarget() {
        if (!this._chatterContainerTarget) {
            this._chatterContainerTarget = document.createElement("div");
            this._chatterContainerTarget.classList.add("o_FormRenderer_chatterContainer");
        }
        this.$chatterContainerHook = $('<div class="o_FormRenderer_chatterContainer"/>');
        return this.$chatterContainerHook;
    },
    /**
     * Mount the chatter
     *
     * Force re-mounting chatter component in DOM. This is necessary
     * because each time `_renderView` is called, it puts old content
     * in a fragment.
     *
     * @private
     */
    async _mountChatterContainerComponent() {
        try {
            await this._chatterContainerComponent.mount(this._chatterContainerTarget);
        } catch (error) {
            if (error.message !== "Mounting operation cancelled") {
                throw error;
            }
        }
    },
    /**
     * @override
     */
    _renderNode(node) {
        if (node.tag === 'div' && node.attrs.class === 'oe_chatter') {
            if (this._isFromFormViewDialog) {
                return $('<div/>');
            }
            return this._makeChatterContainerTarget();
        }
        return this._super(...arguments);
    },
    /**
     * The last rendering of the form view has just been applied into the DOM,
     * so we replace our chatter container hook by the actual chatter container.
     *
     * @override
     */
    _updateView() {
        this._super(...arguments);
        if (this._hasChatter()) {
            this.$chatterContainerHook.replaceWith(this._chatterContainerTarget);
        }
    },
    /**
     * Overrides the function to render the chatter once the form view is
     * rendered.
     *
     * @override
     */
    async __renderView() {
        await this._super(...arguments);
        if (this._hasChatter()) {
            if (!this._chatterContainerComponent) {
                this._makeChatterContainerComponent();
            } else {
                return this._updateChatterContainerComponent();
            }
            await this._mountChatterContainerComponent();
        }
    },
    /**
     * @private
     */
    async _updateChatterContainerComponent() {
        const props = this._makeChatterContainerProps();
        try {
            await this._chatterContainerComponent.update(props);
        } catch (error) {
            if (error.message !== "Mounting operation cancelled") {
                throw error;
            }
        }
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @abstract
     * @private
     * @param {OdooEvent} ev
     * @param {Object} ev.data
     * @param {Attachment[]} ev.data.attachments
     * @param {Thread} ev.data.thread
     */
    _onChatterRendered(ev) {},
});
