/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            messaging menu counter should ignore unread messages in channels that are unpinned
        [Test/model]
            MessagingMenu
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
                    Server
                [Server/data]
                    @test
                    .{Test/data}
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Thread
                [Thread/id]
                    31
                [Thread/isServerPinned]
                    false
                [Thread/model]
                    mail.channel
                [Thread/serverMessageUnreadCounter]
                    1
            {Test/assert}
                [0]
                    @testEnv
                    .{MessagingMenu/counter}
                    .{=}
                        0
                [1]
                    messaging menu counter should ignore unread messages in channels that are unpinned
`;
