/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            initial mount
        [Test/model]
            ChatWindowManagerComponent
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
                    @record
                    .{Test/data}
            @testEnv
            .{Record/insert}
                [Record/traits]
                    ChatWindowManagerComponent
            {Test/assert}
                []
                    @testEnv
                    .{ChatWindowManager/chatWindowManagerComponents}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should have chat window manager
`;
