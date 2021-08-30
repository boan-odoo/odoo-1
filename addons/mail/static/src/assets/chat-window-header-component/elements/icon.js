/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            icon
        [Element/model]
            ChatWindowHeaderComponent
        [Field/target]
            ThreadIconComponent
        [Record/traits]
            ChatWindowHeaderComponent/item
        [Element/isPresent]
            @record
            .{ChatWindowHeaderComponent/chatWindow}
            .{ChatWindow/thread}
            .{&}
                @record
                .{ChatWindowHeaderComponent/chatWindow}
                .{ChatWindow/thread}
                .{Thread/model}
                .{=}
                    mail.channel
        [ThreadIconComponent/thread]
            @record
            .{ChatWindowHeaderComponent/chatWindow}
            .{ChatWindow/thread}
`;
