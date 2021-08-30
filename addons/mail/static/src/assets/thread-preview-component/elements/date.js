/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            date
        [Element/model]
            ThreadPreviewComponent
        [web.Element/tag]
            span
        [Record/traits]
            NotificationListItemComponent/date
        [Element/isPresent]
            @record
            .{ThreadPreviewComponent/threadPreviewView}
            .{ThreadPreviewView/thread}
            .{Thread/lastMessage}
            .{&}
                @record
                .{ThreadPreviewComponent/threadPreviewView}
                .{ThreadPreviewView/thread}
                .{Thread/lastMessage}
                .{Message/date}
        [web.Element/textContent]
            @record
            .{ThreadPreviewComponent/threadPreviewView}
            .{ThreadPreviewView/thread}
            .{Thread/lastMessage}
            .{Message/date}
            .{Moment/fromNow}
`;
