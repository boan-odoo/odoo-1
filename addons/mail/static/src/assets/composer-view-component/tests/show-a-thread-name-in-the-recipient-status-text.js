/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            show a thread name in the recipient status text
        [Test/model]
            ComposerViewComponent
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
            :thread
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        Thread
                    [Thread/composer]
                        @testEnv
                        .{Record/insert}
                            [Record/traits]
                                Composer
                            [Composer/isLog]
                                false
                    [Thread/id]
                        20
                    [Thread/model]
                        res.partner
                    [Thread/name]
                        test name
            @testEnv
            .{Record/insert}
                [Record/traits]
                    ComposerViewComponent
                [ComposerViewComponent/composer]
                    @thread
                    .{Thread/composer}
                [ComposerViewComponent/hasFollowers]
                    true
            {Test/assert}
                []
                    @thread
                    .{Thread/composer}
                    .{Composer/composerViewComponents}
                    .{Collection/first}
                    .{ComposerViewComponent/followers}
                    .{web.Element/textContent}
                    .{=}
                        To: Followers of "testname"
                []
                    basic rendering when sending a message to the followers and thread does have a name
`;
