/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            notificationRequestView
        [Field/model]
            NotificationListView
        [Field/type]
            one
        [Field/target]
            NotificationRequestView
        [Field/isCausal]
            true
        [Field/inverse]
            NotificationRequestView/notificationListViewOwner
        [Field/compute]
            {if}
                @record
                .{NotificationListView/filter}
                .{=}
                    all
                .{&}
                    {Env/isNotificationPermissionDefault}
            .{then}
                {Record/insert}
                    [Record/traits]
                        NotificationRequestView
            .{else}
                {Record/empty}
`;
