/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            base rendering editable
        [Test/model]
            FollowerListMenuComponent
        [Test/assertions]
            5
        [scenario]
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
                        100
                    [Thread/model]
                        res.partner
            @testEnv
            .{Record/insert}
                [Record/traits]
                    FollowerListMenuComponent
                [FollowerListMenuComponent/thread]
                    @thread
            {Test/assert}
                []
                    @thread
                    .{Thread/followerListMenuComponents}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should have followers menu component
            {Test/assert}
                []
                    @thread
                    .{Thread/followerListMenuComponents}
                    .{Collection/first}
                    .{FollowerListMenuComponent/buttonFollowers}
                []
                    should have followers button
            {Test/assert}
                []
                    @thread
                    .{Thread/followerListMenuComponents}
                    .{Collection/first}
                    .{FollowerListMenuComponent/buttonFollowers}
                    .{web.Element/isDisabled}
                    .{isFalsy}
                []
                    followers button should not be disabled
            {Test/assert}
                []
                    @thread
                    .{Thread/followerListMenuComponents}
                    .{Collection/first}
                    .{FollowerListMenuComponent/dropdown}
                    .{isFalsy}
                []
                    followers dropdown should not be opened

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @thread
                    .{Thread/followerListMenuComponents}
                    .{Collection/first}
                    .{FollowerListMenuComponent/buttonFollowers}
            {Test/assert}
                []
                    @thread
                    .{Thread/followerListMenuComponents}
                    .{Collection/first}
                    .{FollowerListMenuComponent/dropdown}
                []
                    followers dropdown should be opened
`;
