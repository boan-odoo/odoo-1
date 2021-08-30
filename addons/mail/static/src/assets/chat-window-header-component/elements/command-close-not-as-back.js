/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            commandCloseNotAsBack
        [Element/model]
            ChatWindowHeaderComponent
        [Record/traits]
            ChatWindowHeaderComponent/command
            ChatWindowHeaderComponent/commandClose
        [web.Element/title]
            {Locale/text}
                Close chat window
        [Element/isPresent]
            @record
            .{ChatWindowHeaderComponent/hasCloseAsBackButton}
            .{isFalsy}
        [Element/onClick]
            {web.Event/stopPropagation}
                @ev
            {ChatWindow/close}
                @record
                .{ChatWindowHeaderComponent/chatWindow}
`;
