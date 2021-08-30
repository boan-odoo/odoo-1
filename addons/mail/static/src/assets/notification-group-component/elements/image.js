/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            image
        [Element/model]
            NotificationGroupComponent
        [web.Element/tag]
            img
        [Record/traits]
            NotificationListItemComponent/image
        [web.Element/class]
            rounded-circle
        [web.Element/src]
            {if}
                @record
                .{NotificationGroupComponent/notificationGroupView}
                .{NotificationGroupView/notificationGroup}
                .{NotificationGroup/type}
                .{=}
                    email
            .{then}
                /mail/static/src/img/smiley/mailfailure.jpg
        [web.Element/alt]
            {Locale/text}
                Message delivery failure image
`;
