/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            new message autocomplete should automatically select first result
        [Test/model]
            ChatWindowManagerComponent
        [Test/assertions]
            1
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                [0]
                    [Record/traits]
                        res.partner
                    [res.partner/id]
                        131
                    [res.partner/name]
                        Partner 131
                [1]
                    [Record/traits]
                        res.users
                    [res.users/partner_id]
                        131
            :imSearchDef
                {Record/insert}
                    [Record/traits]
                        Deferred
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
                            :res
                                @original
                            {if}
                                @args
                                .{Dict/get}
                                    method
                                .{=}
                                    im_search
                            .{then}
                                {Deferred/resolve}
                                    @imSearchDef
                            @original
            @testEnv
            .{Record/insert}
                []
                    [Record/traits]
                        ChatWindowManagerComponent
                []
                    [Record/traits]
                        MessagingMenuComponent
            {Dev/comment}
                open "new message" chat window
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{MessagingMenu/messagingMenuComponents}
                    .{Collection/first}
                    .{MessagingMenuComponent/toggler}
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{MessagingMenu/messagingMenuComponents}
                    .{Collection/first}
                    .{MessagingMenuComponent/newMessageButton}
            {Dev/comment}
                search for a user in "new message" autocomplete
            @testEnv
            .{UI/insertText}
                131
            @testEnv
            .{UI/keydown}
                @testEnv
                .{MessagingMenu/messagingMenuComponents}
                .{Collection/first}
                .{MessagingMenuComponent/newMessageFormInput}
            @testEnv
            .{UI/keyup}
                @testEnv
                .{MessagingMenu/messagingMenuComponents}
                .{Collection/first}
                .{MessagingMenuComponent/newMessageFormInput}
            {Dev/comment}
                Wait for search RPC to be resolved. The following await lines are
                necessary because autocomplete is an external lib therefore it is not
                possible to use 'afterNextRender'.
            {Promise/await}
                imSearchDef
            {Utils/nextAnimationFrame}
            {Test/hasClass}
                [0]
                    @record
                [1]
                    .ui-autocomplete
                    .ui-menu-item
                    a
                [2]
                    ui-state-active
                [3]
                    first autocomplete result should be automatically selected
`;
