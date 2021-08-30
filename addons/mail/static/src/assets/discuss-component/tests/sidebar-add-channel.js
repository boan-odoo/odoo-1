/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            sidebar: add channel
        [Test/model]
            DiscussComponent
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
                [Record/traits]
                    DiscussComponent
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/discussSidebarComponents}
                    .{Collection/first}
                    .{DiscussSidebarComponent/channelCategory}
                    .{DiscussSidebarCategoryComponent/commandAdd}
                []
                    should be able to add channel from category
            {Test/assert}
                @testEnv
                .{Discuss/discussSidebarComponents}
                .{Collection/first}
                .{DiscussSidebarComponent/channelCategory}
                .{DiscussSidebarCategoryComponent/commandAdd}
                .{web.Element/title}
                .{=}
                    Add or join a channel

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{Discuss/discussSidebarComponents}
                    .{Collection/first}
                    .{DiscussSidebarComponent/channelCategory}
                    .{DiscussSidebarCategoryComponent/commandAdd}
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/discussSidebarComponents}
                    .{Collection/first}
                    .{DiscussSidebarComponent/channelCategory}
                    .{DiscussSidebarCategoryComponent/addingItem}
                []
                    should have item to add a new channel
`;
