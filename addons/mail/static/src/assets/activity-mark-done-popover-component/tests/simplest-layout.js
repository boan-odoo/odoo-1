/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            simplest layout
        [Test/model]
            ActivityMarkDonePopoverComponent
        [Test/assertions]
            6
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
            @testEnv
            .{Record.insert}
                []
                    [Record/traits]
                        res.partner
                    [res.partner/activity_ids]
                        12
                    [res.partner/id]
                        100
                []
                    [Record/traits]
                        mail.activity
                    [mail.activity/activity_category]
                        not_upload_file
                    [mail.activity/can_write]
                        true
                    [mail.activity/id]
                        12
                    [mail.activity/res_id]
                        100
                    [mail.activity/res_model]
                        res.partner
            @testEnv
            .{Record/insert}
                [Record/traits]
                    ChatterContainerComponent
                [ChatterContainerComponent/threadId]
                    100
                [ChatterContainerComponent/threadModel]
                    res.partner
            @testEnv
            .{UI/click}
                @activity
                .{Activity/activityComponents}
                .{Collection/first}
                .{ActivityComponent/markDoneButton}
            {Test/assert}
                []
                    @activity
                    .{Activity/activityMarkDonePopoverComponents}
                    .{Collection/length}
                    .{=}
                        1
                []
                    Popover component should be present
            {Test/assert}
                []
                    @activity
                    .{Activity/activityMarkDonePopoverComponents}
                    .{Collection/first}
                    .{ActivityMarkDonePopoverComponent/feedback}
                []
                    Popover component should contain the feedback textarea
            {Test/assert}
                []
                    @activity
                    .{Activity/activityMarkDonePopoverComponents}
                    .{Collection/first}
                    .{ActivityMarkDonePopoverComponent/buttons}
                []
                    Popover component should contain the action buttons
            {Test/assert}
                []
                    @activity
                    .{Activity/activityMarkDonePopoverComponents}
                    .{Collection/first}
                    .{ActivityMarkDonePopoverComponent/doneScheduleNextButton}
                []
                    Popover component should contain the done & schedule next button
            {Test/assert}
                []
                    @activity
                    .{Activity/activityMarkDonePopoverComponents}
                    .{Collection/first}
                    .{ActivityMarkDonePopoverComponent/doneButton}
                []
                    Popover component should contain the done button
            {Test/assert}
                []
                    @activity
                    .{Activity/activityMarkDonePopoverComponents}
                    .{Collection/first}
                    .{ActivityMarkDonePopoverComponent/discardButton}
                []
                    Popover component should contain the discard button
`;
