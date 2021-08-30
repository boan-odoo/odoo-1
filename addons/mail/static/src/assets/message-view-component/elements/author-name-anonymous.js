/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            authorNameAnonymous
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
                .{isFalsy}
            .{&}
                @record
                .{MessageViewComponent/messageView}
                .{MessageView/message}
                .{Message/emailFrom}
                .{isFalsy}
        [web.Element/textContent]
            {Locale/text}
                Anonymous
`;
