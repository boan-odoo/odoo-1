/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Handles click on this "Done & Schedule Next" button.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            ActivityMarkDonePopoverView/onClickDoneAndScheduleNext
        [Action/params]
            record
                [type]
                    ActivityMarkDonePopoverView
        [Action/behavior]
            {Activity/markAsDoneAndScheduleNext}
                [0]
                    @record
                    .{ActivityMarkDonePopoverView/activityViewOwner}
                    .{ActivityView/activity}
                [1]
                    [feedback]
                        @record
                        .{ActivityMarkDonePopoverView/feedbackTextareaRef}
                        .{web.Element/value}
`;
