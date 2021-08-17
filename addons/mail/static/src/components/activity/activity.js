/** @odoo-module **/

import { useComponentToModel } from '@mail/component_hooks/use_component_to_model/use_component_to_model';
import { useModels } from '@mail/component_hooks/use_models/use_models';
import { useRefToModel } from '@mail/component_hooks/use_ref_to_model/use_ref_to_model';
import { useShouldUpdateBasedOnProps } from '@mail/component_hooks/use_should_update_based_on_props/use_should_update_based_on_props';
import { ActivityMarkDonePopover } from '@mail/components/activity_mark_done_popover/activity_mark_done_popover';
import { FileUploader } from '@mail/components/file_uploader/file_uploader';
import { MailTemplate } from '@mail/components/mail_template/mail_template';

import {
    auto_str_to_date,
    getLangDateFormat,
    getLangDatetimeFormat,
} from 'web.time';

const { Component, useState } = owl;

const components = {
    ActivityMarkDonePopover,
    FileUploader,
    MailTemplate,
};

export class Activity extends Component {


    /**
     * @override
     */
    constructor(...args) {
        super(...args);
        useComponentToModel({ fieldName: 'component', modelName: 'mail.activity', propNameAsRecordLocalId: 'activityLocalId' });
        useShouldUpdateBasedOnProps();
        useRefToModel({ fieldName: 'fileUploaderRef', modelName: 'mail.activity', propNameAsRecordLocalId: 'activityLocalId', refName: 'fileUploader' });
        this.state = useState({
            areDetailsVisible: false,
        });
        useModels();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @returns {mail.activity}
     */
    get activity() {
        return this.env.models['mail.activity'].get(this.props.activityLocalId);
    }

    /**
     * @returns {string}
     */
    get assignedUserText() {
        return _.str.sprintf(this.env._t("for %s"), this.activity.assignee.nameOrDisplayName);
    }

    /**
     * @returns {string}
     */
    get delayLabel() {
        const today = moment().startOf('day');
        const momentDeadlineDate = moment(auto_str_to_date(this.activity.dateDeadline));
        // true means no rounding
        const diff = momentDeadlineDate.diff(today, 'days', true);
        if (diff === 0) {
            return this.env._t("Today:");
        } else if (diff === -1) {
            return this.env._t("Yesterday:");
        } else if (diff < 0) {
            return _.str.sprintf(this.env._t("%d days overdue:"), Math.abs(diff));
        } else if (diff === 1) {
            return this.env._t("Tomorrow:");
        } else {
            return _.str.sprintf(this.env._t("Due in %d days:"), Math.abs(diff));
        }
    }

    /**
     * @returns {string}
     */
    get formattedCreateDatetime() {
        const momentCreateDate = moment(auto_str_to_date(this.activity.dateCreate));
        const datetimeFormat = getLangDatetimeFormat();
        return momentCreateDate.format(datetimeFormat);
    }

    /**
     * @returns {string}
     */
    get formattedDeadlineDate() {
        const momentDeadlineDate = moment(auto_str_to_date(this.activity.dateDeadline));
        const datetimeFormat = getLangDateFormat();
        return momentDeadlineDate.format(datetimeFormat);
    }

    /**
     * @returns {string}
     */
    get MARK_DONE() {
        return this.env._t("Mark Done");
    }

    /**
     * @returns {string}
     */
    get summary() {
        return _.str.sprintf(this.env._t("“%s”"), this.activity.summary);
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _onClickDetailsButton() {
        this.state.areDetailsVisible = !this.state.areDetailsVisible;
    }

}

Object.assign(Activity, {
    components,
    props: {
        activityLocalId: String,
    },
    template: 'mail.Activity',
});
