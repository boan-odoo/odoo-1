/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            NotificationGroupView
        [Model/id]
            NotificationGroupView/notificationListViewOwner
            .{&}
                NotificationGroupView/notificationGroup
        [Model/fields]
            notificationGroup
            notificationListViewOwner
`;
