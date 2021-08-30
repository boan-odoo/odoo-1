/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            chat with author should be opened after clicking on his im status icon
        [Test/model]
            MessageViewComponent
        [Test/assertions]
            4
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                []
                    [Record/traits]
                        res.partner
                    [res.partner/id]
                        10
                []
                    [Record/traits]
                        res.users
                    [res.users/partner_id]
                        10
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
            :message
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        Message
                    [Message/author]
                        @testEnv
                        .{Record/insert}
                            [Record/traits]
                                Partner
                            [Partner/id]
                                10
                            [Partner/imStatus]
                                online
                    [Message/id]
                        10
            @testEnv
            .{Record/insert}
                []
                    [Record/traits]
                        ChatWindowManagerComponent
                []
                    [Record/traits]
                        MessageViewComponent
                    [MessageViewComponent/message]
                        @message
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/partnerImStatusIcon}
                []
                    message should have the author im status icon
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/hasOpenChat}
                []
                    author im status icon should have the open chat style

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/partnerImStatusIcon}
            {Test/assert}
                []
                    @testEnv
                    .{ChatWindowManager/chatWindows}
                    .{Collection/length}
                    .{=}
                        1
                []
                    chat window with thread should be opened after clicking on author im status icon
            {Test/assert}
                []
                    @testEnv
                    .{ChatWindowManager/chatWindows}
                    .{Collection/first}
                    .{ChatWindow/thread}
                    .{ChatWindow/correspondent}
                    .{=}
                        @message
                        .{Message/author}
                []
                    chat with author should be opened after clicking on his im status icon
`;
