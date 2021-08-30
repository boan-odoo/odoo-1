/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            failure on loading messages should display error
        [Test/model]
            ThreadViewComponent
        [Test/assertions]
            1
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                [Record/traits]
                    mail.channel
                [mail.channel/channel_type]
                    channel
                [mail.channel/id]
                    20
                [mail.channel/is_pinned]
                    true
                [mail.channel/name]
                    General
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
                        [Function/out]
                            {if}
                                @route
                                .{=}
                                    /mail/channel/messages
                            .{then}
                                {Error/raise}
                            @original
            :thread
                @testEnv
                .{Record/findById}
                    [Thread/id]
                        20
                    [Thread/model]
                        mail.channel
            :threadViewer
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        ThreadViewer
                    [ThreadViewer/hasThreadView]
                        true
                    [ThreadViewer/thread]
                        @thread
            @testEnv
            .{Record/insert}
                [Record/traits]
                    ThreadViewComponent
                [ThreadViewComponent/threadView]
                    @threadViewer
                    .{ThreadViewer/threadView}
            {Test/assert}
                []
                    @threadViewer
                    .{ThreadViewer/threadView}
                    .{ThreadView/threadViewComponents}
                    .{Collection/first}
                    .{ThreadViewComponent/loadingFailed}
                []
                    should show loading error message
`;
