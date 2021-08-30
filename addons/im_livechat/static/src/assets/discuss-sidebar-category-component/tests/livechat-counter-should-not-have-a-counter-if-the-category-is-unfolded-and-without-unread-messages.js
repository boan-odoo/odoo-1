/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            livechat - counter: should not have a counter if the category is unfolded and without unread messages
        [Test/model]
            DiscussSidebarCategoryComponent
        [Test/feature]
            im_livechat
        [Test/assertions]
            1
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
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/categoryLivechat}
                    .{DiscussSidebarCategory/counter}
                    .{=}
                        0
                []
                    should not have a counter if the category is unfolded and without unread messages
`;
