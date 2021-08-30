/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            channel - states: close should update the value on the server
        [Test/model]
            DiscussSidebarCategoryComponent
        [Test/assertions]
            2
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                [0]
                    [Record/traits]
                        mail.channel
                    [mail.channel/id]
                        20
                [1]
                    [Record/traits]
                        res.users.settings
                    [res.users.settings/user_id]
                        @record
                        .{Test/data}
                        .{Data/currentUserId}
                    [res.users.settings/is_discuss_sidebar_category_channel_open]
                        false
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
            :initalSettings
                @testEnv
                .{Env/owlEnv}
                .{Dict/get}
                    services
                .{Dict/get}
                    rpc
                .{Function/call}
                    [model]
                        res.users.settings
                    [method]
                        _find_or_create_for_user
                    [args]
                        {Record/insert}
                            [Record/traits]
                                Collection
                            {Record/insert}
                                [Record/traits]
                                    Collection
                                @record
                                .{Test/data}
                                .{Data/currentUserId}
            {Test/assert}
                []
                    @initalSettings
                    .{Dict/get}
                        is_discuss_sidebar_category_channel_open
                    .{=}
                        false
                []
                    the vaule in server side should be false
        
            @testEnv
            .{UI/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{Discuss/categoryChannel}
                    .{DiscussSidebarCategory/discussSidebarCategoryComponents}
                    .{Collection/first}
                    .{DiscussSidebarCategoryComponent/title}
            :newSettings
                @testEnv
                .{Env/owlEnv}
                .{Dict/get}
                    services
                .{Dict/get}
                    rpc
                .{Function/call}
                    [model]
                        res.users.settings
                    [method
                        _find_or_create_for_user
                    [args]
                        {Record/insert}
                            [Record/traits]
                                Collection
                            {Record/insert}
                                [Record/traits]
                                    Collection
                                @record
                                .{Test/data}
                                .{Data/currentUserId}
            {Test/assert}
                []
                    @newSettings
                    .{Dict/get}
                        is_discuss_sidebar_category_channel_open
                    .{=}
                        true
                []
                    the vaule in server side should be false
`;
