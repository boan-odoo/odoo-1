/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            messaging not initialized
        [Test/model]
            MessagingMenuComponent
        [Test/assertions]
            2
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
                    [Env/waitUntilMessagingCondition]
                        created
            @testEnv
            .[Record/insert]
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
                                    {Dev/comment}
                                        simulate messaging never initialized
                                    {Promise/await}
                                @original
            @testEnv
            .{Record/insert}
                [Record/traits]
                    MessagingMenuComponent
            {Test/assert}
                []
                    @testEnv
                    .{MessagingMenu/messagingMenuComponents}
                    .{Collection/first}
                    .{MessagingMenuComponent/loading}
                []
                    should display loading icon on messaging menu when messaging not yet initialized

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{MessagingMenu/messagingMenuComponents}
                    .{Collection/first}
                    .{MessagingMenuComponent/toggler}
            {Test/assert}
                []
                    @testEnv
                    .{MessagingMenu/messagingMenuComponents}
                    .{Collection/first}
                    .{MessagingMenuComponent/dropdownLoadingLabel}
                []
                    should prompt loading when opening messaging menu
`;
