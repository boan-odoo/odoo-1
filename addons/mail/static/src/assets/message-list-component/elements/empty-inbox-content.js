/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            emptyInboxContent
        [Element/model]
            MessageListComponent
        [web.Element/tag]
            span
        [Element/isPresent]
            @record
            .{MessageListComponent/messageListView}
            .{MessageListView/threadViewOwner}
            .{ThreadView/thread}
            .{=}
                {Env/inbox}
        [web.Element/textContent]
            {Locale/text}
                New messages appear here.
`;
