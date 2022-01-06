/** @odoo-module **/

import { addRecordMethods } from '@mail/model/model_core';
// ensure that the model definition is loaded before the patch
import '@mail/models/activity_view/activity_view';

addRecordMethods('ActivityView', {
    /**
     * Handles click on the "grant access" button.
     */
    async onGrantAccess(ev) {
        const { chatter } = this.activityBoxView; // save value before deleting activity
        await this.env.services.orm.call(
            'slide.channel',
            'action_grant_access',
            [[this.activity.thread.id]],
            { partner_id: this.activity.requestingPartner.id },
        );
        if (this.activity) {
            this.activity.delete();
        }
        chatter.reloadParentView();
    },
    /**
     * Handles click on the "refuse access" button.
     */
    async onRefuseAccess(ev) {
        const { chatter } = this.activityBoxView; // save value before deleting activity
        await this.env.services.orm.call(
            'slide.channel',
            'action_refuse_access',
            [[this.activity.thread.id]],
            { partner_id: this.activity.requestingPartner.id },
        );
        if (this.activity) {
            this.activity.delete();
        }
        chatter.reloadParentView();
    },
});
