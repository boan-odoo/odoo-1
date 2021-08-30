/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            basic rendering of tracking value (monetary type)
        [Test/model]
            MessageViewComponent
        [Test/assertions]
            8
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
                    [Env/owlEnv]
                        [session]
                            [currencies]
                                [1]
                                    [symbol]
                                        $
                                    [position]
                                        before
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
                    [Message/id]
                        11
                    [Message/trackingValues]
                        [0]
                            [changed_field]
                                Revenue
                            [currency_id]
                                1
                            [field_type]
                                monetary
                            [id]
                                6
                            [new_value]
                                500
                            [old_value]
                                1000
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
                    .{MessageViewComponent/trackingValue}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should display a tracking value
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/trackingValueFieldName}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should display the name of the tracked field
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/trackingValueFieldName}
                    .{Collection/first}
                    .{web.Element/textContent}
                    .{=}
                        Revenue:
                []
                    should display the correct tracked field name (Revenue)
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/trackingValueOldValue}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should display the old value
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/trackingValueOldValue}
                    .{Collection/first}
                    .{web.Element/textContent}
                    .{=}
                        $ 1000.00
                []
                    should display the correct old value with the currency symbol ($ 1000.00)
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/trackingValueSeparator}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should display the separator
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/trackingValueNewValue}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should display the new value
            {Test/assert}
                []
                    @message
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/trackingValueNewValue}
                    .{Collection/first}
                    .{web.Element/textContent}
                    .{=}
                        $ 500.00
                []
                    should display the correct new value with the currency symbol ($ 500.00)
`;
