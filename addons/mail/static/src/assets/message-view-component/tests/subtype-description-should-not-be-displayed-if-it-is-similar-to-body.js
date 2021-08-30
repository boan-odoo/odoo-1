/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            subtype description should not be displayed if it is similar to body
        [Test/model]
            MessageViewComponent
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
                    Server
                [Server/data]
                    @record
                    .{Test/data}
            :message
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        Message
                    [Message/body]
                        <p>Hello</p>
                    [Message/id]
                        100
                    [Message/subtypeDescription]
                        hello
            @testEnv
            .{Record/insert}
                [Record/traits]
                    MessageViewComponent
                [MessageViewComponent/message]
                    @message
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/content}
                []
                    message should have content
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/content}
                    .{web.Element/textContent}
                    .{=}
                        Hello
                []
                    message content should display only body when subtype description is similar
`;
