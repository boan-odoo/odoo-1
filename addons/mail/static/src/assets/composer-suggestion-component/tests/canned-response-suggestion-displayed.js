/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            canned response suggestion displayed
        [Test/model]
            ComposerSuggestionComponent
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
            :cannedResponse
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        CannedReponse
                    [CannedResponse/id]
                        7
                    [CannedResponse/source]
                        hello
                    [CannedResponse/substitution]
                        Hello, how are you?
            @testEnv
            .{Record/insert}
                [Record/traits]
                    ComposerSuggestionComponent
                [ComposerSuggestionComponent/composer]
                    @thread
                    .{Thread/composer}
                [ComposerSuggestionComponent/isActive]
                    true
                [ComposerSuggestionComponent/modelName]
                    CannedResponse
                [ComposerSuggestionComponent/record]
                    @cannedResponse
            {Test/assert}
                []
                    @thread
                    .{Thread/composer}
                    .{Composer/composerSuggestionComponents}
                    .{Collection/length}
                    .{=}
                        1
                []
                    Canned response suggestion should be present
`;
