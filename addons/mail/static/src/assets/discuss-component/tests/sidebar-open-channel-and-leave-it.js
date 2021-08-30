/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            sidebar: open channel and leave it
        [Test/model]
            DiscussComponent
        [Test/assertions]
            7
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                {Dev/comment}
                    channel that is expected to be found in the sidebar
                    with a random unique id that will be referenced in the test
                [Record/traits]
                    mail.channel
                [mail.channel/id]
                    20
                [mail.channel/is_minimized]
                    true
                [mail.channel/state]
                    open
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
                [Server/mockRPC]
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            route
                            args
                            original
                        [Function/out]
                            {if}
                                @args
                                .{Dict/get}
                                    method
                                .{=}
                                    execute_command
                            .{then}
                                {Test/step}
                                    execute_command
                                {Test/assert}
                                    []
                                        @args
                                        .{Dict/get}
                                            args
                                        .{Collection/first}
                                        .{=}
                                            {Record/insert}
                                                [Record/traits]
                                                    Collection
                                                20
                                    []
                                        The right id is sent to the server to remove
                                {Test/assert}
                                    []
                                        @args
                                        .{Dict/get}
                                            kwargs
                                        .{Dict/get}
                                            command
                                        .{=}
                                            leave
                                    []
                                        The right command is sent to the server
                            @original
            @testEnv
            .{Record/insert}
                [Record/traits]
                    DiscussComponent
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{Record/findById}
                        [Thread/id]
                            20
                        [Thread/model]
                            mail.channel
                    .{Thread/discussSidebarCategoryItemComponents}
                    .{Collection/first}
            {Test/verifySteps}
                []
                    {Record/insert}
                        [Record/traits]
                            Collection
                []
                    action_unfollow is not called yet

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{Record/findById}
                        [Thread/id]
                            20
                        [Thread/model]
                            mail.channel
                    .{Thread/discussSidebarCategoryItemComponents}
                    .{Collection/first}
                    .{DiscussSidebarCategoryItemComponent/commandLeave}
            {Test/verifySteps}
                []
                    action_unfollow
                []
                    action_unfollow has been called when leaving a channel
            {Test/assert}
                []
                    @testEnv
                    .{Record/findById}
                        [Thread/id]
                            20
                        [Thread/model]
                            mail.channel
                    .{Thread/discussComponents}
                    .{Collection/length}
                    .{=}
                        0
                []
                    the channel must have been removed from discuss sidebar
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/thread}
                    .{isFalsy}
                []
                    should have no thread opened in discuss
`;
