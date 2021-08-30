/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            unreadHiddenConversationAmount
        [Field/model]
            ChatWindowManager
        [Field/type]
            attr
        [Field/target]
            Number
        [Field/compute]
            @record
            .{ChatWindowManager/allOrderedHidden}
            .{Collection/filter}
                {Record/insert}
                    [Record/traits]
                        Function
                    [Function/in]
                        item
                    [Function/out]
                        @item
                        .{ChatWindow/thread}
                        .{isFalsy}
            .{Collection/reduce}
                {Record/insert}
                    [Record/traits]
                        Function
                    [Function/in]
                        acc
                        item
                    [Function/out]
                        {if}
                            @item
                            .{Thread/localMessageUnreadCounter}
                            .{>}
                                0
                        .{then}
                            @acc
                            .{+}
                                1
                        .{else}
                            @acc
                0
`;
