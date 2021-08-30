/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            base rendering editable
        [Test/model]
            FollowButtonComponent
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
                        100
                    [Thread/model]
                        res.partner
            @testEnv
            .{Record/insert}
                [Record/traits]
                    FollowButtonComponent
                [FollowButtonComponent/thread]
                    @thread
            {Test/assert}
                []
                    @thread
                    .{Thread/followButtonComponents}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should have follow button component
            {Test/assert}
                []
                    @thread
                    .{Thread/followButtonComponents}
                    .{Collection/first}
                    .{FollowButtonComponent/follow}
                []
                    should have 'Follow' button
            {Test/assert}
                []
                    @thread
                    .{Thread/followButtonComponents}
                    .{Collection/first}
                    .{FollowButtonComponent/follow}
                    .{web.Element/isDisabled}
                    .{isFalsy}
                []
                    'Follow' button should be disabled
`;
