/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            rendering when just everyone has seen the message
        [Test/model]
            MessageSeenIndicatorComponent
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
            :thread
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        Thread
                    [Thread/id]
                        1000
                    [Thread/model]
                        mail.channel
                    [Thread/messageSeenIndicators]
                        @testEnv
                        .{Record/insert}
                            [Record/traits]
                                MessageSeenIndicator
                            [MessageSeenIndicator/message]
                                @testEnv
                                .{Record/insert}
                                    [Record/traits]
                                        Message
                                    [Message/id]
                                        100
                    [Thread/partnerSeenInfos]
                        []
                            @testEnv
                            .{Record/insert}
                                [Record/traits]
                                    ThreadPartnerSeenInfo
                                [ThreadPartnerSeenInfo/lastFetchedMessage]
                                    @testEnv
                                    .{Record/insert}
                                        [Record/traits]
                                            Message
                                        [Message/id]
                                            100
                                [ThreadPartnerSeenInfo/lastSeenMessage]
                                    @testEnv
                                    .{Record/insert}
                                        [Record/traits]
                                            Message
                                        [Message/id]
                                            100
                                [ThreadPartnerSeenInfo/partner]
                                    @testEnv
                                    .{Record/insert}
                                        [Record/traits]
                                            Partner
                                        [Partner/id]
                                            10
                        []
                            @testEnv
                            .{Record/insert}
                                [Record/traits]
                                    ThreadPartnerSeenInfo
                                [ThreadPartnerSeenInfo/lastFetchedMessage]
                                    @testEnv
                                    .{Record/insert}
                                        [Record/traits]
                                            Message
                                        [Message/id]
                                            100
                                [ThreadPartnerSeenInfo/lastSeenMessage]
                                    @testEnv
                                    .{Record/insert}
                                        [Record/traits]
                                            Message
                                        [Message/id]
                                            100
                                [ThreadPartnerSeenInfo/partner]
                                    @testEnv
                                    .{Record/insert}
                                        [Record/traits]
                                            Partner
                                        [Partner/id]
                                            100
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
                            [Partner/displayName]
                                Demo User
                            [Partner/id]
                                @testEnv
                                .{Env/currentPartner}
                                .{Partner/id}
                    [Message/body]
                        <p>Test</p>
                    [Message/id]
                        100
                    [Message/originThread]
                        @thread
            @testEnv
            .{Record/insert}
                [Record/traits]
                    MessageSeenIndicatorComponent
                [MessageSeenIndicatorComponent/message]
                    @message
                [MessageSeenIndicatorComponent/thread]
                    @thread
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            MessageSeenIndicatorComponent
                    .{Collection/length}
                    .{=}
                        1
                []
                    should display a message seen indicator component
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            MessageSeenIndicatorComponent
                    .{Collection/first}
                    .{MessageSeenIndicatorComponent/messageSeenIndicator}
                    .{MessageSeenIndicator/hasEveryoneSeen}
                []
                    indicator component should not considered as all seen
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            MessageSeenIndicatorComponent
                    .{Collection/first}
                    .{MessageSeenIndicatorComponent/icon}
                    .{Collection/length}
                    .{=}
                        2
                []
                    should display two seen indicator icon
`;
