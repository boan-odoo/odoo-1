/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            simplest layout of a not followed subtype
        [Test/model]
            FollowerSubtypeComponent
        [Test/assertions]
            5
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
            :follower
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        Follower
                    [Follower/followedThread]
                        @thread
                    [Follower/id]
                        2
                    [Follower/isActive]
                        true
                    [Follower/isEditable]
                        true
                    [Follower/partner]
                        @testEnv
                        .{Record/insert}
                            [Record/traits]
                                Partner
                            [Partner/id]
                                1
                            [Partner/name]
                                François Perusse
            :followerSubtype
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        FollowerSubtype
                    [FollowerSubtype/id]
                        1
                    [FollowerSubtype/isDefault]
                        true
                    [FollowerSubtype/isInternal]
                        false
                    [FollowerSubtype/name]
                        Dummy test
                    [FollowerSubtype/resModel]
                        res.partner
            @testEnv
            .{Record/update}
                [0]
                    @follower
                [1]
                    [Follower/subtypes]
                        @testEnv
                        .{Field/add}
                            @followerSubtype
            @testEnv
            .{Record/insert}
                [Record/traits]
                    FollowerSubtypeComponent
                [FollowerSubtypeComponent/follower]
                    @follower
                [FollowerSubtypeComponent/followerSubtype]
                    @followerSubtype
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            FollowerSubtypeComponent
                    .{Collection/length}
                    .{=}
                        1
                []
                    should have follower subtype component
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            FollowerSubtypeComponent
                    .{Collection/first}
                    .{FollowerSubtypeComponent/label}
                []
                    should have a label
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            FollowerSubtypeComponent
                    .{Collection/first}
                    .{FollowerSubtypeComponent/checkbox}
                []
                    should have a checkbox
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            FollowerSubtypeComponent
                    .{Collection/first}
                    .{FollowerSubtypeComponent/label}
                    .{web.Element/textContent}
                    .{=}
                        Dummy test
                []
                    should have the name of the subtype as label
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            FollowerSubtypeComponent
                    .{Collection/first}
                    .{FollowerSubtypeComponent/checkbox}
                    .{web.Element/isChecked}
                    .{isFalsy}
                []
                    checkbox should not be checked as follower subtype is not followed
`;
