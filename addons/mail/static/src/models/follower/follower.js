/** @odoo-module **/

import { registerModel } from '@mail/model/model_core';
import { attr, many, one } from '@mail/model/model_field';
import { clear, insert, insertAndReplace, link, unlink, unlinkAll } from '@mail/model/model_field_command';

registerModel({
    name: 'Follower',
    identifyingFields: ['id'],
    modelMethods: {
        /**
         * @param {Object} data
         * @returns {Object}
         */
        convertData(data) {
            const data2 = {};
            if ('id' in data) {
                data2.id = data.id;
            }
            if ('is_active' in data) {
                data2.isActive = data.is_active;
            }
            if ('is_editable' in data) {
                data2.isEditable = data.is_editable;
            }
            if ('partner_id' in data) {
                if (!data.partner_id) {
                    data2.partner = unlinkAll();
                } else {
                    const partnerData = {
                        display_name: data.display_name,
                        email: data.email,
                        id: data.partner_id,
                        name: data.name,
                    };
                    data2.partner = insert(partnerData);
                }
            }
            if (data.partner) {
                data2.partner = insertAndReplace(this.models['Partner'].convertData(data.partner));
            }
            return data2;
        },
    },
    recordMethods: {
        /**
         *  Close subtypes dialog
         */
        closeSubtypes() {
            this.update({ followerSubtypeListDialog: clear() });
        },
        /**
         * Opens the most appropriate view that is a profile for this follower.
         */
        async openProfile() {
            return this.partner.openProfile();
        },
        /**
         * Remove this follower from its related thread.
         */
        async remove() {
            const partner_ids = [];
            partner_ids.push(this.partner.id);
            await this.async(() => this.env.services.orm.call(
                this.followedThread.model,
                'message_unsubscribe',
                [[this.followedThread.id], partner_ids]
            ));
            const followedThread = this.followedThread;
            this.delete();
            followedThread.fetchData(['suggestedRecipients']);
        },
        /**
         * @param {FollowerSubtype} subtype
         */
        selectSubtype(subtype) {
            if (!this.selectedSubtypes.includes(subtype)) {
                this.update({ selectedSubtypes: link(subtype) });
            }
        },
        /**
         * Show (editable) list of subtypes of this follower.
         */
        async showSubtypes() {
            const subtypesData = await this.async(() => this.env.services.rpc(
                '/mail/read_subscription_data',
                { follower_id: this.id },
            ));
            this.update({ subtypes: unlinkAll() });
            for (const data of subtypesData) {
                const subtype = this.messaging.models['FollowerSubtype'].insert(
                    this.messaging.models['FollowerSubtype'].convertData(data)
                );
                this.update({ subtypes: link(subtype) });
                if (data.followed) {
                    this.update({ selectedSubtypes: link(subtype) });
                } else {
                    this.update({ selectedSubtypes: unlink(subtype) });
                }
            }
            this.update({ followerSubtypeListDialog: insertAndReplace() });
        },
        /**
         * @param {FollowerSubtype} subtype
         */
        unselectSubtype(subtype) {
            if (this.selectedSubtypes.includes(subtype)) {
                this.update({ selectedSubtypes: unlink(subtype) });
            }
        },
        /**
         * Update server-side subscription of subtypes of this follower.
         */
        async updateSubtypes() {
            if (this.selectedSubtypes.length === 0) {
                this.remove();
            } else {
                const kwargs = {
                    subtype_ids: this.selectedSubtypes.map(subtype => subtype.id),
                };
                if (this.partner) {
                    kwargs.partner_ids = [this.partner.id];
                }
                await this.async(() => this.env.services.orm.call(
                    this.followedThread.model,
                    'message_subscribe',
                    [[this.followedThread.id]],
                    kwargs,
                ));
                this.env.services['notification'].add(
                    this.env._t("The subscription preferences were successfully applied."),
                    { type: 'success' },
                );
            }
            this.closeSubtypes();
        },
    },
    fields: {
        followedThread: one('Thread', {
            inverse: 'followers',
        }),
        followerSubtypeListDialog: one('Dialog', {
            inverse: 'followerOwnerAsSubtypeList',
            isCausal: true,
        }),
        id: attr({
            readonly: true,
            required: true,
        }),
        isActive: attr({
            default: true,
        }),
        isEditable: attr({
            default: false,
        }),
        partner: one('Partner', {
            required: true,
        }),
        selectedSubtypes: many('FollowerSubtype'),
        subtypes: many('FollowerSubtype'),
    },
});
