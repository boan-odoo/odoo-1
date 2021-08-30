/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            emptyHistoryTitle
        [Element/model]
            MessageListComponent
        [Record/traits]
            MessageListComponent/emptyTitle
        [web.Element/class]
            o-neutral-face-icon
        [Element/isPresent]
            @record
            .{MessageListComponent/messageListView}
            .{MessageListView/threadViewOwner}
            .{ThreadView/thread}
            .{=}
                {Env/history}
        [web.Element/textContent]
            {Locale/text}
                No history messages
`;
