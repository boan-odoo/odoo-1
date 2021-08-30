/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            livechat - counter: should have correct value of unread threads if category is folded and with unread messages
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
                [0]
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
                    [mail.channel/message_unread_counter]
                        10
                [1]
                    [Record/traits]
                        res.users.settings
                    [res.users.settings/user_id]
                        @record
                        .{Test/data}
                        .{Data/currentUserId}
                    [res.users.settings/is_discuss_sidebar_category_livechat_open]
                        false
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
                        1
                []
                    should have correct value of unread threads if category is folded and with unread messages
`;
