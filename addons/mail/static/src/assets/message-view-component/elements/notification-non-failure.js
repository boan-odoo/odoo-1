/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            notificationNonFailure
        [Element/model]
            MessageViewComponent
        [web.Element/tag]
            span
        [Record/traits]
            MessageViewComponent/notificationIconClickable
        [Element/isPresent]
            @record
            .{MessageViewComponent/threadView}
            .{&}
                @record
                .{MessageViewComponent/messageView}
                .{MessageView/message}
                .{Message/originThread}
            .{&}
                @record
                .{MessageViewComponent/messageView}
                .{MessageView/message}
                .{message/originThread}
                .{=}
                    @record
                    .{MessageViewComponent/threadView}
                    .{ThreadView/thread}
            .{&}
                @record
                .{MessageViewComponent/messageView}
                .{MessageView/message}
                .{Message/notifications}
                .{Collection/length}
                .{>}
                    0
            .{&}
                @record
                .{MessageViewComponent/messageView}
                .{MessageView/message}
                .{Message/failureNotifications}
                .{Collection/length}
                .{=}
                    0
`;
