/** @odoo-module **/

import { useUpdate } from '@mail/component_hooks/use_update/use_update';
import { registerMessagingComponent } from '@mail/utils/messaging_component';

const { Component } = owl;

export class Discuss extends Component {

    /**
     * @override
     */
    setup() {
        this._updateLocalStoreProps();
        useUpdate({ func: () => this._update() });
    }

    _update() {
        if (!this.discussView) {
            return;
        }
        if (this.discussView.discuss.thread) {
            this.trigger('o-push-state-action-manager');
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
            this.trigger('o-show-rainbow-man');
        }
        this._activeThreadCache = this.discussView.discuss.threadView && this.discussView.discuss.threadView.threadCache;
        this._updateLocalStoreProps();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

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

}

Object.assign(Discuss, {
    props: { localId: String },
    template: 'mail.Discuss',
});

registerMessagingComponent(Discuss);
