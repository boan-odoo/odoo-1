/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            send message toggling
        [Test/model]
            ChatterTopbarComponent
        [Test/assertions]
            4
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                [Record/traits]
                    res.partner
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
                    100
                [ChatterContainerComponent/threadModel]
                    res.partner
            {Test/assert}
                []
                    @chatter
                    .{Chatter/chatterTopbarComponents}
                    .{Collection/first}
                    .{ChatterTopbarComponent/buttonSendMessage}
                []
                    should have a 'Send Message' button
            {Test/assert}
                []
                    @chatter
                    .{Chatter/chatterTopbarComponents}
                    .{Collection/first}
                    .{ChatterTopbarComponent/isButtonSendActive}
                    .{isFalsy}
                []
                    'Send Message' button should not be active

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
                    @chatter
                    .{Chatter/chatterTopbarComponents}
                    .{Collection/first}
                    .{ChatterTopbarComponent/isButtonSendActive}
                []
                    'Send Message' button should be active

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
                    @chatter
                    .{Chatter/chatterTopbarComponents}
                    .{Collection/first}
                    .{ChatterTopbarComponent/isButtonSendActive}
                    .{isFalsy}
                []
                    'Send Message' button should not be active
`;
