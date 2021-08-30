/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            no new message when discuss is open
        [Test/model]
            MessagingMenuComponent
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
                        MessagingMenuComponent
                []
                    [Record/traits]
                        DiscussComponent
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
                    .{MessagingMenuComponent/newMessageButton}
                    .{isFalsy}
                []
                    should not have 'new message' when discuss is open

            {Dev/comment}
                simulate closing discuss app
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{Discuss/close}
            {Test/assert}
                []
                    @testEnv
                    .{MessagingMenu/messagingMenuComponents}
                    .{Collection/first}
                    .{MessagingMenuComponent/newMessageButton}
                []
                    should have 'new message' when discuss is closed

            {Dev/comment}
                simulate opening discuss app
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{Discuss/open}
            {Test/assert}
                []
                    @testEnv
                    .{MessagingMenu/messagingMenuComponents}
                    .{Collection/first}
                    .{MessagingMenuComponent/newMessageButton}
                    .{isFalsy}
                []
                    should not have 'new message' when discuss is open again
`;
