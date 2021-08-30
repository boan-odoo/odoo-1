/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            suggested recipient without partner are unchecked by default
        [Test/model]
            ChatterComponent
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
                    res.fake
                [res.fake/id]
                    10
                [res.fake/email_cc]
                    john@test.be
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
                    ChatterContainerComponent
                [ChatterContainerComponent/threadId]
                    10
                [ChatterContainerComponent/threadModel]
                    res.fake
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @chatter
                    .{Chatter/chatterTopbarComponents}
                    .{Collection/first}
                    .{ChatterTopbarComponent/buttonSendMessage}
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            ComposerSuggestedRecipientComponent
                    .{Collection/first}
                    .{ComposerSuggestedRecipientComponent/checkboxInput}
                    .{web.Element/isChecked}
                    .{isFalsy}
                []
                    suggested recipient without partner must be unchecked by default
`;
