/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            no show more 3 or less suggested recipients
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
                [0]
                    [Record/traits]
                        res.fake
                    [res.fake/email_cc]
                        john@test.be
                    [res.fake/id]
                        10
                    [res.fake/partner_ids]
                        100
                [1]
                    [Record/traits]
                        res.partner
                    [res.partner/display_name]
                        John Jane
                    [res.partner/email]
                        john@jane.be
                    [res.partner/id]
                        100
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
                            ComposerSuggestedRecipientListComponent
                    .{Collection/first}
                    .{ComposerSuggestedRecipientListComponent/showMore}
                    .{isFalsy}
                []
                    should not display 'show more' button with 3 or less suggested recipients
`;
