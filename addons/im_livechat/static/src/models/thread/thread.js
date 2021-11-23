/** @odoo-module **/

import { addFields, addRecordMethods, patchModelMethods, patchRecordMethods } from '@mail/model/model_core';
import { many2one } from '@mail/model/model_field';
import { clear, insert, link, replace, unlink } from '@mail/model/model_field_command';
// ensure that the model definition is loaded before the patch
import '@mail/models/thread/thread';

addFields('mail.thread', {
    /**
     * If set, current thread is a livechat.
     */
    messagingAsLivechat: many2one('mail.messaging', {
        compute: '_computeMessagingAsLivechat',
        inverse: 'livechats',
    }),
});

addRecordMethods('mail.thread', {
    /**
     * @private
     * @returns {FieldCommand} 
     */
    _computeMessagingAsLivechat() {
        if (!this.messaging || this.channel_type !== 'livechat') {
            return clear();
        }
        return replace(this.messaging);
    },
});

patchModelMethods('mail.thread', {
    /**
     * @override
     */
    convertData(data) {
        const data2 = this._super(data);
        if ('livechat_visitor' in data && data.livechat_visitor) {
            if (!data2.members) {
                data2.members = [];
            }
            // `livechat_visitor` without `id` is the anonymous visitor.
            if (!data.livechat_visitor.id) {
                /**
                 * Create partner derived from public partner and replace the
                 * public partner.
                 *
                 * Indeed the anonymous visitor is registered as a member of the
                 * channel as the public partner in the database to avoid
                 * polluting the contact list with many temporary partners.
                 *
                 * But the issue with public partner is that it is the same
                 * record for every livechat, whereas every correspondent should
                 * actually have its own visitor name, typing status, etc.
                 *
                 * Due to JS being temporary by nature there is no such notion
                 * of polluting the database, it is therefore acceptable and
                 * easier to handle one temporary partner per channel.
                 */
                data2.members.push(unlink(this.messaging.publicPartners));
                const partner = this.messaging.models['mail.partner'].create(
                    Object.assign(
                        this.messaging.models['mail.partner'].convertData(data.livechat_visitor),
                        { id: this.messaging.models['mail.partner'].getNextPublicId() }
                    )
                );
                data2.members.push(link(partner));
                data2.correspondent = link(partner);
            } else {
                const partnerData = this.messaging.models['mail.partner'].convertData(data.livechat_visitor);
                data2.members.push(insert(partnerData));
                data2.correspondent = insert(partnerData);
            }
        }
        return data2;
    },
});

patchRecordMethods('mail.thread', {
    /**
     * @override
     */
    _computeCorrespondent() {
        if (this.channel_type === 'livechat') {
            // livechat correspondent never change: always the public member.
            return;
        }
        return this._super();
    },
    /**
     * @override
     */
    _computeDisplayName() {
        if (this.channel_type === 'livechat' && this.correspondent) {
            if (this.correspondent.country) {
                return `${this.correspondent.nameOrDisplayName} (${this.correspondent.country.name})`;
            }
            return this.correspondent.nameOrDisplayName;
        }
        return this._super();
    },
    /**
     * @override
     */
    _computeHasInviteFeature() {
        if (this.channel_type === 'livechat') {
            return true;
        }
        return this._super();
    },
    /**
     * @override
     */
    _computeHasMemberListFeature() {
        if (this.channel_type === 'livechat') {
            return true;
        }
        return this._super();
    },
    /**
     * @override
     */
    _computeIsChatChannel() {
        return this.channel_type === 'livechat' || this._super();
    },
    /**
     * @override
     */
    _getDiscussSidebarCategory() {
        switch (this.channel_type) {
            case 'livechat':
                return this.messaging.discuss.categoryLivechat;
        }
        return this._super();
    }
});
