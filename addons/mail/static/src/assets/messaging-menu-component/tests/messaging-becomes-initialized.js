/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            messaging becomes initialized
        [Test/model]
            MessagingMenuComponent
        [Test/assertions]
            2
        [Test/scenario]
            :messagingInitialized
                {Record/insert}
                    [Record/traits]
                        Deferred
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
                    [Env/waitUntilMessagingCondition]
                        created
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
                                @route
                                .{=}
                                    /mail/init_messaging
                            .{then}
                                {Promise/await}
                                    @messagingInitialized
                            @original
            @testEnv
            .{Record/insert}
                [Record/traits]
                    MessagingMenuComponent
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{MessagingMenu/messagingMenuComponents}
                    .{Collection/first}
                    .{MessagingMenuComponent/toggler}

            {Dev/comment}
                simulate messaging becomes initialized
            @testEnv
            .{Component/afterNextRender}
                {Promise/resolve}
                    @messagingInitialized
            {Test/assert}
                []
                    @testEnv
                    .{MessagingMenu/messagingMenuComponents}
                    .{Collection/first}
                    .{MessagingMenuComponent/loading}
                    .{isFalsy}
                []
                    should no longer display loading icon on messaging menu when messaging becomes initialized
            {Test/assert}
                []
                    @testEnv
                    .{MessagingMenu/messagingMenuComponents}
                    .{Collection/first}
                    .{MessagingMenuComponent/dropdownLoadingLabel}
                    .{isFalsy}
                []
                    should no longer prompt loading when opening messaging menu when messaging becomes initialized
`;
