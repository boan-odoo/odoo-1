/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            authorNameGuest
        [Element/model]
            MessageViewComponent
        [Record/traits]
            MessageViewComponent/authorName
        [Element/isPresent]
            @record
            .{MessageViewComponent/messageView}
            .{MessageView/message}
            .{Message/author}
            .{isFalsy}
            .{&}
                @record
                .{MessageViewComponent/messageView}
                .{MessageView/message}
                .{Message/guestAuthor}
        [web.Element/textContent]
            @record
            .{MessageViewComponent/messageView}
            .{MessageView/message}
            .{Message/guestAuthor}
            .{Guest/name}
`;
