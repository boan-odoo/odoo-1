/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Handles click on this "Done" button.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            ActivityMarkDonePopoverView/onClickDone
        [Action/params]
            record
                [type]
                    ActivityMarkDonePopoverView
        [Action/behavior]
            {Activity/markAsDone}
                [0]
                    @record
                    .{ActivityMarkDonePopoverView/activityViewOwner}
                    .{ActivityView/activity}
                [1]
                    [feedback]
                        @record
                        .{ActivityMarkDonePopoverView/feedbackTextareaRef}
                        .{web.Element/value}
            {if}
                {Record/exists}
                    @record
                .{isFalsy}
                .{|}
                    @record
                    .{ActivityMarkDonePopoverView/component}
                    .{isFalsy}
            .{then}
                {break}
            {Component/trigger}
                [0]
                    @record
                    .{ActivityMarkDonePopoverView/component}
                [1]
                    reload
                [2]
                    [keepChanges]
                        true
`;
