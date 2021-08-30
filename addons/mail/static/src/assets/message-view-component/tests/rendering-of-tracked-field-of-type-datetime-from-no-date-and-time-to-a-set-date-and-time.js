/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            rendering of tracked field of type datetime: from no date and time to a set date and time
        [Test/model]
            MessageViewComponent
        [Test/assertions]
            1
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
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
                                Deadline
                            [field_type]
                                datetime
                            [id]
                                6
                            [new_value]]
                                2018-12-14 13:42:28
                            [old_value]
                                false
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
                    .{Collection/first}
                    .{web.Element/textContent}
                    .{=}
                        Deadline:None12/14/2018 13:42:28
                []
                    should display the correct content of tracked field of type datetime: from no date and time to a set date and time (Deadline: None -> 12/14/2018 13:42:28)
`;
