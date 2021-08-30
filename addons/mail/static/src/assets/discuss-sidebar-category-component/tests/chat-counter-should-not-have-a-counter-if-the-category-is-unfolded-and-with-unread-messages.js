/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            chat - counter: should not have a counter if the category is unfolded and with unread messages
        [Test/model]
            DiscussSidebarCategoryComponent
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
                [mail.channel/channel_type]
                    chat
                [mail.channel/id]
                    10
                [mail.channel/message_unread_counter]
                    10
                [mail.channel/public]
                    private
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
                    .{Discuss/categoryChat}
                    .{DiscussSidebarCategory/counter}
                    .{=}
                        0
                []
                    should not have a counter if the category is unfolded and with unread messages
`;
