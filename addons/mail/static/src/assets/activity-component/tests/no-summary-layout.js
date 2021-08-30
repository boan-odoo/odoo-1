/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            no summary layout
        [Test/model]
            ActivityComponent
        [Test/assertions]
            3
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
            .{Record/insert}
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
                    [mail.activity/activity_type_id]
                        1
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
            {Test/assert}
                []
                    @activity
                    .{Activity/activityComponents}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should have activity component
            {Test/assert}
                []
                    @activity
                    .{Activity/activityComponents}
                    .{Collection/first}
                    .{ActivityComponent/descriptionDetailType}
                []
                    activity details should have an activity type section
            {Test/assert}
                []
                    @activity
                    .{Activity/activityComponents}
                    .{Collection/first}
                    .{ActivityComponent/descriptionDetailType}
                    .{Collection/textContent}
                    .{=}
                        Email
                []
                    activity details should have the activity type display name in type section
`;
