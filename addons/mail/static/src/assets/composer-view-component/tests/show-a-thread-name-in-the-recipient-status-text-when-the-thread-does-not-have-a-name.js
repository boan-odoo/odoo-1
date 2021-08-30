/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            show a default status in the recipient status text when the thread does not have a name
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
                        To: Followers of this document
                []
                    Composer should display "To: Followers of this document" if the thread as no name.
`;
