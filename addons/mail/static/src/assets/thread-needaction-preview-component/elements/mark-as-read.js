/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            markAsRead
        [Element/model]
            ThreadNeedactionPreviewComponent
        [web.Element/tag]
            span
        [Record/traits]
            NotificationListItemComponent.markAsRead
            ThreadNeedactionPreviewComponent/coreItem
        [web.Element/class]
            fa
            fa-check
        [web.Element/title]
            {Locale/text}
                Mark as Read
        [Element/onClick]
            {Message/markAllAsRead}
                model
                .{=}
                    @record
                    .{ThreadNeedactionPreviewComponent/threadNeedactionPreviewView}
                    .{ThreadNeedactionPreviewView/thread}
                    .{Thread/model}
                .{&}
                    res_id
                    .{=}
                        @record
                        .{ThreadNeedactionPreviewComponent/threadNeedactionPreviewView}
                        .{ThreadNeedactionPreviewView/thread}
                        .{Thread/id}
`;
