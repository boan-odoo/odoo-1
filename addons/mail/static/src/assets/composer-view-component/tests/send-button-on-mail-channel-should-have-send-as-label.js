/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            send button on mail.channel should have "Send" as label
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
                    mail.channel
                [mail.channel/id]
                    20
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
            :thread
                @testEnv
                .{Record/findById}
                    [Thread/id]
                        20
                    [Thread/model]
                        mail.channel
            @testEnv
            .{Record/insert}
                [Record/traits]
                    ComposerViewComponent
                [ComposerViewComponent/composerView]
                    {Record/insert}
                        [Record/traits]
                            ComposerView
                        [ComposerView/composer]
                            @thread
                            .{Thread/composer}
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            ComposerViewComponent
                    .{Collection/first}
                    .{ComposerViewComponent/buttonSend}
                    .{web.Element/textContent}
                    .{=}
                        Send
                []
                    Send button of mail.channel composer should have 'Send' as label
`;
