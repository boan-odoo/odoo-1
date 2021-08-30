/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            livechat in the sidebar: basic rendering
        [Test/feature]
            im_livechat
        [Test/model]
            DiscussComponent
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
                    mail.channel
                [mail.channel/anonymous_name]
                    Visitor 11
                [mail.channel/channel_type]
                    livechat
                [mail.channel/id]
                    11
                [mail.channel/livechat_operator_id]
                    @record
                    .{Test/data}
                    .{Data/currentPartnerId}
                [mail.channel/members]
                    [0]
                        @record
                        .{Test/data}
                        .{Data/currentPartnerId}
                    [1]
                        @record
                        .{Test/data}
                        .{Data/publicPartnerId}
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
                    .{Discuss/discussComponents}
                    .{Collection/first}
                    .{DiscussComponent/sidebar}
                []
                    should have a sidebar section
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/discussComponents}
                    .{Collection/first}
                    .{DiscussComponent/sidebar}
                    .{DiscussSidebarComponent/categoryLivechat}
                []
                    should have a channel category livechat
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/discussComponents}
                    .{Collection/first}
                    .{DiscussComponent/sidebar}
                    .{DiscussSidebarComponent/categoryLivechat}
                    .{DiscussSidebarCategory/titleText}
                    .{web.Element/textContent}
                    .{=}
                        Livechat
                []
                    should have a channel category named 'Livechat'
            {Test/assert}
                []
                    @testEnv
                    .{Record/findById}
                        [Thread/id]
                            11
                        [Thread/model]
                            mail.channel
                    .{Thread/discussSidebarCategoryItemComponents}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should have a livechat in sidebar
            {Test/assert}
                []
                    @testEnv
                    .{Record/findById}
                        [Thread/id]
                            11
                        [Thread/model]
                            mail.channel
                    .{Thread/discussSidebarCategoryItemComponents}
                    .{Collection/first}
                    .{DiscussSidebarCategoryItemComponent/nameNonEditable}
                    .{web.Element/textContent}
                    .{=}
                        Visitor 11
                []
                    should have 'Visitor 11' as livechat name
`;
