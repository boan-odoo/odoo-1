/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            seenIndicatorSquashed
        [Element/model]
            MessageViewComponent
        [Field/target]
            MessageSeenIndicatorComponent
        [Record/traits]
            MessageViewComponent/seenIndicator
        [MessageSeenIndicatorComponent/message]
            @record
            .{MessageViewComponent/messageView}
            .{MessageView/message}
        [MessageSeenIndicatorComponent/thread]
            @record
            .{MessageViewComponent/threadView}
            .{ThreadView/thread}
        [Element/isPresent]
            @record
            .{MessageViewComponent/isActive}
            .{&}
                @record
                .{MessageViewComponent/messageView}
                .{MessageView/message}
                .{Message/isCurrentUserOrGuestAuthor}
            .{&}
                @record
                .{MessageViewComponent/threadView}
            .{&}
                @record
                .{MessageViewComponent/threadView}
                .{ThreadView/thread}
            .{&}
                @record
                .{MessageViewComponent/threadView}
                .{ThreadView/thread}
                .{Thread/hasSeenIndicators}
`;
