/** @odoo-module **/

import { registerNewModel } from '@mail/model/model_core';
import { attr, many2one, one2many, one2one } from '@mail/model/model_field';
import { clear, create, link, unlink, update } from '@mail/model/model_field_command';
import { isEventHandled } from '@mail/utils/utils';

function factory(dependencies) {

    class ChatWindow extends dependencies['mail.model'] {

        /**
         * @override
         */
        _created() {
            this.onClickedHeader = this.onClickedHeader.bind(this);
            this.onWillHideHomeMenu = this.onWillHideHomeMenu.bind(this);
            this.onWillShowHomeMenu = this.onWillShowHomeMenu.bind(this);
            this.onKeydown = this.onKeydown.bind(this);
            this.onFocusinThread = this.onFocusinThread.bind(this);
            this.onFocusout = this.onFocusout.bind(this);

            const res = super._created(...arguments);
            this._onShowHomeMenu.bind(this);
            this._onHideHomeMenu.bind(this);

            this.env.messagingBus.on('hide_home_menu', this, this._onHideHomeMenu);
            this.env.messagingBus.on('show_home_menu', this, this._onShowHomeMenu);
            if (this.component) {
                this.env.messagingBus.on('will_hide_home_menu', this, this.onWillHideHomeMenu);
                this.env.messagingBus.on('will_show_home_menu', this, this.onWillShowHomeMenu);
            }
            return res;
        }

        /**
         * @override
         */
        _willDelete() {
            this.env.messagingBus.off('hide_home_menu', this, this._onHideHomeMenu);
            this.env.messagingBus.off('show_home_menu', this, this._onShowHomeMenu);
            if (this.component) {
                this.env.messagingBus.off('will_hide_home_menu', this, this.onWillHideHomeMenu);
                this.env.messagingBus.off('will_show_home_menu', this, this.onWillShowHomeMenu);
            }
            return super._willDelete(...arguments);
        }

        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------

        /**
         * Close this chat window.
         *
         * @param {Object} [param0={}]
         * @param {boolean} [param0.notifyServer]
         */
        close({ notifyServer } = {}) {
            if (notifyServer === undefined) {
                notifyServer = !this.env.messaging.device.isMobile;
            }
            const thread = this.thread;
            this.delete();
            // Flux specific: 'closed' fold state should only be saved on the
            // server when manually closing the chat window. Delete at destroy
            // or sync from server value for example should not save the value.
            if (thread && notifyServer) {
                thread.notifyFoldStateToServer('closed');
            }
            if (this.env.device.isMobile && !this.env.messaging.discuss.isOpen) {
                // If we are in mobile and discuss is not open, it means the
                // chat window was opened from the messaging menu. In that
                // case it should be re-opened to simulate it was always
                // there in the background.
                this.env.messaging.messagingMenu.update({ isOpen: true });
            }
        }

        expand() {
            if (this.thread) {
                this.thread.open({ expanded: true });
            }
        }

        /**
         * Programmatically auto-focus an existing chat window.
         */
        focus() {
            this.update({ isDoFocus: true });
        }

        focusNextVisibleUnfoldedChatWindow() {
            const nextVisibleUnfoldedChatWindow = this._getNextVisibleUnfoldedChatWindow();
            if (nextVisibleUnfoldedChatWindow) {
                nextVisibleUnfoldedChatWindow.focus();
            }
        }

        focusPreviousVisibleUnfoldedChatWindow() {
            const previousVisibleUnfoldedChatWindow =
                this._getNextVisibleUnfoldedChatWindow({ reverse: true });
            if (previousVisibleUnfoldedChatWindow) {
                previousVisibleUnfoldedChatWindow.focus();
            }
        }

        /**
         * @param {Object} [param0={}]
         * @param {boolean} [param0.notifyServer]
         */
        fold({ notifyServer } = {}) {
            if (notifyServer === undefined) {
                notifyServer = !this.env.messaging.device.isMobile;
            }
            this.update({ isFolded: true });
            // Flux specific: manually folding the chat window should save the
            // new state on the server.
            if (this.thread && notifyServer) {
                this.thread.notifyFoldStateToServer('folded');
            }
        }

        /**
         * Makes this chat window active, which consists of making it visible,
         * unfolding it, and focusing it.
         *
         * @param {Object} [options]
         */
        makeActive(options) {
            this.makeVisible();
            this.unfold(options);
            this.focus();
        }

        /**
         * Makes this chat window visible by swapping it with the last visible
         * chat window, or do nothing if it is already visible.
         */
        makeVisible() {
            if (this.isVisible) {
                return;
            }
            const lastVisible = this.manager.lastVisible;
            this.manager.swap(this, lastVisible);
        }

        /**
         * Called when selecting an item in the autocomplete input of the
         * 'new_message' chat window.
         *
         * @private
         * @param {Event} ev
         * @param {Object} ui
         * @param {Object} ui.item
         * @param {integer} ui.item.id
         */
        async onAutocompleteSelect(ev, ui) {
            const chat = await this.env.messaging.getChat({ partnerId: ui.item.id });
            if (!chat) {
                return;
            }
            this.manager.openThread(chat, {
                makeActive: true,
                replaceNewMessage: true,
            });
        }

        /**
         * Called when typing in the autocomplete input of the 'new_message' chat
         * window.
         *
         * @private
         * @param {Object} req
         * @param {string} req.term
         * @param {function} res
         */
        onAutocompleteSource(req, res) {
            this.env.models['mail.partner'].imSearch({
                callback: (partners) => {
                    const suggestions = partners.map(partner => {
                        return {
                            id: partner.id,
                            value: partner.nameOrDisplayName,
                            label: partner.nameOrDisplayName,
                        };
                    });
                    res(_.sortBy(suggestions, 'label'));
                },
                keyword: _.escape(req.term),
                limit: 10,
            });
        }

        /**
         * Called when an element in the thread becomes focused.
         */
        onFocusinThread(ev) {
            ev.stopPropagation();
            if (!this.exists()) {
                // prevent crash on destroy
                return;
            }
            this.update({ isFocused: true });
        }

        /**
         * Handle onFocusout of the chat window.
         */
        onFocusout() {
            if (!this.exists()) {
                // prevent crash on destroy
                return;
            }
            this.update({ isFocused: false });
        }

        /**
         * Handle keydown on chat_window.
         *
         * @param {KeyboardEvent} ev
         */
        onKeydown(ev) {
            if (!this.exists()) {
                // prevent crash on destroy
                return;
            }
            switch (ev.key) {
                case 'Tab':
                    ev.preventDefault();
                    if (ev.shiftKey) {
                        this.focusPreviousVisibleUnfoldedChatWindow();
                    } else {
                        this.focusNextVisibleUnfoldedChatWindow();
                    }
                    break;
                case 'Escape':
                    if (isEventHandled(ev, 'ComposerTextInput.closeSuggestions')) {
                        break;
                    }
                    if (isEventHandled(ev, 'Composer.closeEmojisPopover')) {
                        break;
                    }
                    ev.preventDefault();
                    this.focusNextVisibleUnfoldedChatWindow();
                    this.close();
                    break;
            }
        }

        /**
         * Swap this chat window with the previous one.
         */
        shiftPrev() {
            this.manager.shiftPrev(this);
        }

        /**
         * Swap this chat window with the next one.
         */
        shiftNext() {
            this.manager.shiftNext(this);
        }

        /**
         * @param {Object} [param0={}]
         * @param {boolean} [param0.notifyServer]
         */
        unfold({ notifyServer } = {}) {
            if (notifyServer === undefined) {
                notifyServer = !this.env.messaging.device.isMobile;
            }
            this.update({ isFolded: false });
            // Flux specific: manually opening the chat window should save the
            // new state on the server.
            if (this.thread && notifyServer) {
                this.thread.notifyFoldStateToServer('open');
            }
        }

        //----------------------------------------------------------------------
        // Private
        //----------------------------------------------------------------------

        /**
         * @private
         * @returns {boolean}
         */
        _computeHasNewMessageForm() {
            return this.isVisible && !this.isFolded && !this.thread;
        }

        /**
         * @private
         * @returns {boolean}
         */
        _computeHasShiftPrev() {
            if (!this.manager) {
                return false;
            }
            const allVisible = this.manager.allOrderedVisible;
            const index = allVisible.findIndex(visible => visible === this);
            if (index === -1) {
                return false;
            }
            return index < allVisible.length - 1;
        }

        /**
         * @private
         * @returns {boolean}
         */
        _computeHasShiftNext() {
            if (!this.manager) {
                return false;
            }
            const index = this.manager.allOrderedVisible.findIndex(visible => visible === this);
            if (index === -1) {
                return false;
            }
            return index > 0;
        }

        /**
         * @private
         * @returns {boolean}
         */
        _computeHasThreadView() {
            return this.isVisible && !this.isFolded && !!this.thread;
        }

        /**
         * @private
         * @returns {boolean}
         */
        _computeIsFolded() {
            const thread = this.thread;
            if (thread) {
                return thread.foldState === 'folded';
            }
            return this.isFolded;
        }

        /**
         * @private
         * @returns {boolean}
         */
        _computeIsVisible() {
            if (!this.manager) {
                return false;
            }
            return this.manager.allOrderedVisible.includes(this);
        }

        /**
         * @private
         * @returns {string}
         */
        _computeName() {
            if (this.thread) {
                return this.thread.displayName;
            }
            return this.env._t("New message");
        }

        /**
         * @private
         * @returns {mail.thread_viewer}
         */
        _computeThreadViewer() {
            const threadViewerData = {
                hasThreadView: this.hasThreadView,
                thread: this.thread ? link(this.thread) : unlink(),
            };
            if (!this.threadViewer) {
                return create(threadViewerData);
            }
            return update(threadViewerData);
        }

        /**
         * @private
         * @returns {integer|undefined}
         */
        _computeVisibleIndex() {
            if (!this.manager) {
                return clear();
            }
            const visible = this.manager.visual.visible;
            const index = visible.findIndex(visible => visible.chatWindowLocalId === this.localId);
            if (index === -1) {
                return clear();
            }
            return index;
        }

        /**
         * @private
         * @returns {integer}
         */
        _computeVisibleOffset() {
            if (!this.manager) {
                return 0;
            }
            const visible = this.manager.visual.visible;
            const index = visible.findIndex(visible => visible.chatWindowLocalId === this.localId);
            if (index === -1) {
                return 0;
            }
            return visible[index].offset;
        }

        /**
         * Cycles to the next possible visible and unfolded chat window starting
         * from the `currentChatWindow`, following the natural order based on the
         * current text direction, and with the possibility to `reverse` based on
         * the given parameter.
         *
         * @private
         * @param {Object} [param0={}]
         * @param {boolean} [param0.reverse=false]
         * @returns {mail.chat_window|undefined}
         */
        _getNextVisibleUnfoldedChatWindow({ reverse = false } = {}) {
            const orderedVisible = this.manager.allOrderedVisible;
            /**
             * Return index of next visible chat window of a given visible chat
             * window index. The direction of "next" chat window depends on
             * `reverse` option.
             *
             * @param {integer} index
             * @returns {integer}
             */
            const _getNextIndex = index => {
                const directionOffset = reverse ? 1 : -1;
                let nextIndex = index + directionOffset;
                if (nextIndex > orderedVisible.length - 1) {
                    nextIndex = 0;
                }
                if (nextIndex < 0) {
                    nextIndex = orderedVisible.length - 1;
                }
                return nextIndex;
            };

            const currentIndex = orderedVisible.findIndex(visible => visible === this);
            let nextIndex = _getNextIndex(currentIndex);
            let nextToFocus = orderedVisible[nextIndex];
            while (nextToFocus.isFolded) {
                nextIndex = _getNextIndex(nextIndex);
                nextToFocus = orderedVisible[nextIndex];
            }
            return nextToFocus;
        }


        /**
         * Save the scroll positions of the chat window in the store.
         * This is useful in order to remount chat windows and keep previous
         * scroll positions. This is necessary because when toggling on/off
         * home menu, the chat windows have to be remade from scratch.
         *
         * @private
         */
        _saveThreadScrollTop() {
            if (
                !this.threadRef.comp ||
                !this.threadViewer ||
                !this.threadViewer.threadView
            ) {
                return;
            }
            if (this.threadViewer.threadView.componentHintList.length > 0) {
                // the current scroll position is likely incorrect due to the
                // presence of hints to adjust it
                return;
            }
            this.threadViewer.saveThreadCacheScrollHeightAsInitial(
                this.threadRef.comp.getScrollHeight()
            );
            this.threadViewer.saveThreadCacheScrollPositionsAsInitial(
                this.threadRef.comp.getScrollTop()
            );
        }

        /**
         * Called when clicking on header of chat window. Usually folds the chat
         * window.
         *
         * @private
         * @param {CustomEvent} ev
         */
        onClickedHeader(ev) {
            ev.stopPropagation();
            if (this.env.messaging.device.isMobile) {
                return;
            }
            if (this.isFolded) {
                this.unfold();
                this.focus();
            } else {
                this._saveThreadScrollTop();
                this.fold();
            }
        }

        /**
         * Save the scroll positions of the chat window in the store.
         * This is useful in order to remount chat windows and keep previous
         * scroll positions. This is necessary because when toggling on/off
         * home menu, the chat windows have to be remade from scratch.
         *
         * @private
         */
        async onWillHideHomeMenu() {
            console.log('hide');
            this._saveThreadScrollTop();
        }

        /**
         * Save the scroll positions of the chat window in the store.
         * This is useful in order to remount chat windows and keep previous
         * scroll positions. This is necessary because when toggling on/off
         * home menu, the chat windows have to be remade from scratch.
         *
         * @private
         */
        async onWillShowHomeMenu() {
            console.log('show');
            this._saveThreadScrollTop();
        }

        //----------------------------------------------------------------------
        // Handlers
        //----------------------------------------------------------------------

        /**
         * @private
         */
        async _onHideHomeMenu() {
            if (!this.threadView) {
                return;
            }
            this.threadView.addComponentHint('home-menu-hidden');
        }

        /**
         * @private
         */
        async _onShowHomeMenu() {
            if (!this.threadView) {
                return;
            }
            this.threadView.addComponentHint('home-menu-shown');
        }

    }

    ChatWindow.fields = {
        component: attr(),
        /**
         * Determines whether "new message form" should be displayed.
         */
        hasNewMessageForm: attr({
            compute: '_computeHasNewMessageForm',
        }),
        hasShiftPrev: attr({
            compute: '_computeHasShiftPrev',
            default: false,
        }),
        hasShiftNext: attr({
            compute: '_computeHasShiftNext',
            default: false,
        }),
        /**
         * Determines whether `this.thread` should be displayed.
         */
        hasThreadView: attr({
            compute: '_computeHasThreadView',
        }),
        /**
         * Determine whether the chat window should be programmatically
         * focused by observed component of chat window. Those components
         * are responsible to unmark this record afterwards, otherwise
         * any re-render will programmatically set focus again!
         */
        isDoFocus: attr({
            default: false,
        }),
        /**
         * States whether `this` is focused. Useful for visual clue.
         */
        isFocused: attr({
            default: false,
        }),
        /**
         * Determines whether `this` is folded.
         */
        isFolded: attr({
            default: false,
        }),
        /**
         * States whether `this` is visible or not. Should be considered
         * read-only. Setting this value manually will not make it visible.
         * @see `makeVisible`
         */
        isVisible: attr({
            compute: '_computeIsVisible',
        }),
        manager: many2one('mail.chat_window_manager', {
            inverse: 'chatWindows',
        }),
        name: attr({
            compute: '_computeName',
        }),
        /**
         * Determines the `mail.thread` that should be displayed by `this`.
         * If no `mail.thread` is linked, `this` is considered "new message".
         */
        thread: one2one('mail.thread', {
            inverse: 'chatWindow',
        }),
        threadRef: attr(),
        /**
         * States the `mail.thread_view` displaying `this.thread`.
         */
        threadView: one2one('mail.thread_view', {
            related: 'threadViewer.threadView',
        }),
        /**
         * Determines the `mail.thread_viewer` managing the display of `this.thread`.
         */
        threadViewer: one2one('mail.thread_viewer', {
            compute: '_computeThreadViewer',
            isCausal: true,
            readonly: true,
            required: true,
        }),
        /**
         * This field handle the "order" (index) of the visible chatWindow inside the UI.
         *
         * Using LTR, the right-most chat window has index 0, and the number is incrementing from right to left.
         * Using RTL, the left-most chat window has index 0, and the number is incrementing from left to right.
         */
        visibleIndex: attr({
            compute: '_computeVisibleIndex',
        }),
        visibleOffset: attr({
            compute: '_computeVisibleOffset',
        }),
    };

    ChatWindow.modelName = 'mail.chat_window';

    return ChatWindow;
}

registerNewModel('mail.chat_window', factory);
