/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            counter
        [Element/model]
            ChatWindowHeaderComponent
        [Record/traits]
            ChatWindowHeaderComponentitem
        [Element/isPresent]
            @record
            .{ChatWindowHeaderComponent/chatWindow}
            .{ChatWindow/thread}
            .{&}
                @record
                .{ChatWindowHeaderComponent/chatWindow}
                .{ChatWindow/thread}
                .{Thread/localMessageUnreadCounter}
                .{>}
                    0
        [web.Element/textContent]
            {String/sprintf}
                [0]
                    {Locale/text}
                        (%s)
                [1]
                    @record
                    .{ChatWindowHeaderComponent/chatWindow}
                    .{ChatWindow/thread}
                    .{Thread/localMessageUnreadCounter}
`;
