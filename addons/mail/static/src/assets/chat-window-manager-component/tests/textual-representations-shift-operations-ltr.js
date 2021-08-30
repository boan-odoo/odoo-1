/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            textual representations of shift previous/next operations are correctly mapped to left/right in LTR locale
        [Test/model]
            ChatWindowManagerComponent
        [Test/assertions]
            2
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                [Record/traits]
                    mail.channel
                [mail.channel/is_minimized]
                    true
                [mail.channel/is_minimized]
                    true
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @recod
                    .{Test/data}
            @testEnv
            .{Record/insert}
                [Record/traits]
                    ChatWindowManagerComponent
            {Test/assert}
                []
                    @testEnv
                    .{ChatWindowManager/chatWindows}
                    .{Collection/first}
                    .{ChatWindow/chatWindowHeaderComponents}
                    .{Collection/first}
                    .{ChatWindowHeaderComponent/commandShiftPrev}
                    .{web.Element/title}
                    .{=}
                        Shift left
                []
                    shift previous operation should be have 'Shift left' as title in LTR locale
            {Test/assert}
                []
                    @testEnv
                    .{ChatWindowManager/chatWindows}
                    .{Collection/second}
                    .{ChatWindow/chatWindowHeaderComponents}
                    .{Collection/first}
                    .{ChatWindowHeaderComponent/commandShiftPrev}
                    .{web.Element/title}
                    .{=}
                        Shift right
                []
                    shift next operation should have 'Shift right' as title in LTR locale
`;
