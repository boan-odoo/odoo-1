/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            emptyInboxTitle
        [Element/model]
            MessageListComponent
        [Record/traits]
            MessageListComponent/emptyTitle
        [Element/isPresent]
            @record
            .{MessageListComponent/messageListView}
            .{MessageListView/threadViewOwner}
            .{ThreadView/thread}
            .{=}
                {Env/inbox}
        [web.Element/textContent]
            {Locale/text}
                Congratulations, your inbox is empty
`;
