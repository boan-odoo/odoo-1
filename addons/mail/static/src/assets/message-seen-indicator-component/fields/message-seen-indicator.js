/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            messageSeenIndicator
        [Field/model]
            MessageSeenIndicatorComponent
        [Field/type]
            one
        [Field/target]
            MessageSeenIndicator
        [Field/compute]
            {Record/find}
                [Record/traits]
                    MessageSeenIndicator
                {Record/insert}
                    [Record/traits]
                        Function
                    [Function/in]
                        item
                    [Function/out]
                        @item
                        .{MessageSeenIndicator/message}
                        .{=}
                            @record
                            .{MessageSeenIndicator/message}
                        .{&}
                            @item
                            .{MessageSeenIndicator/thread}
                            .{=}
                                @record
                                .{MessageSeenIndicator/thread}
`;
