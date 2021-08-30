/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            threadPreview
        [Element/model]
            NotificationListComponent:notificationView
        [Field/target]
            ThreadPreviewComponent
        [Record/traits]
            NotificationListComponent/preview
        [Element/isPresent]
            @record
            .{NotificationListComponent/notificationListView}
            .{NotificationListView/notificationViews}
            .{Collection/length}
            .{!=}
                0
            .{&}
                @record
                .{NotificationListComponent:notificationView/notificationView}
                .{NotificationView/type}
                .{=}
                    ThreadPreviewView
        [ThreadPreviewComponent/notificationView]
            @record
            .{NotificationListComponent:notificationView/notificationView}
`;
