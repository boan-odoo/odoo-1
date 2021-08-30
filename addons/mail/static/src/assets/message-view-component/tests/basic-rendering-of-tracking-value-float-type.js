/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            basic rendering of tracking value (float type)
        [Test/model]
            MessageViewComponent
        [Test/assertions]
            8
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
                    [Message/id]
                        11
                    [Message/trackingValues]
                        [0]
                            [changed_field]
                                Total
                            [field_type]
                                float
                            [id]
                                6
                            [new_value]
                                45.67
                            [old_value]
                                12.3
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
                        Total:
                []
                    should display the correct tracked field name (Total)
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
                        12.30
                []
                    should display the correct old value (12.30)
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
                        45.67
                []
                    should display the correct new value (45.67)
`;
