/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            display canned response suggestions on typing ":"
        [Test/model]
            ComposerViewComponent
        [Test/assertions]
            2
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
                    [mail.channel/id]
                        20
                [1]
                    [Record/traits]
                        mail.shortcode
                    [mail.shortcode/id]
                        11
                    [mail.shortcode/source]
                        hello
                    [mail.shortcode/substitution]
                        Hello! How are you?
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
                [ComposerViewComponent/composer]
                    @thread
                    .{Thread/composer}
            {Test/assert}
                []
                    @thread
                    .{Thread/composer}
                    .{Composer/composerSuggestionListComponent}
                    .{Collection/length}
                    .{=}
                        0
                []
                    Canned responses suggestions list should not be present

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/focus}
                    @thread
                    .{Thread/composer}
                    .{Composer/composerTextInputComponents}
                    .{Collection/first}
                    .{ComposerTextInputComponent/textarea}
                @testEnv
                .{UI/insertText}
                    :
                @testEnv
                .{UI/keydown}
                    @thread
                    .{Thread/composer}
                    .{Composer/composerTextInputComponents}
                    .{Collection/first}
                    .{ComposerTextInputComponent/textarea}
                @testEnv
                .{UI/keyup}
                    @thread
                    .{Thread/composer}
                    .{Composer/composerTextInputComponents}
                    .{Collection/first}
                    .{ComposerTextInputComponent/textarea}
            {Test/assert}
                []
                    @thread
                    .{Thread/composer}
                    .{Composer/composerSuggestionListComponent}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should display canned response suggestions on typing ':'
`;
