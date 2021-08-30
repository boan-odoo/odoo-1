/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            counter
        [Element/model]
            NotificationGroupComponent
        [web.Element/tag]
            span
        [Record/traits]
            NotificationListItemComponent/bold
            NotificationListItemComponent/counter
        [web.Element/textContent]
            {String/sprintf}
                [0]
                    {Locale/text}
                        (%s)
                [1]
                    @record
                    .{NotificationGroupComponent/notificationGroupView}
                    .{NotificationGroupView/notificationGroup}
                    .{NotificationGroup/notifications}
                    .{Collection/length}
`;
