/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ActionAddon
        [ActionAddon/action]
            NotificationGroupComponent/getImage
        [ActionAddon/feature]
            sms
        [ActionAddon/params]
            record
        [ActionAddon/behavior]
            {if}
                @record
                .{NotificationGroupComponent/notificationGroupView}
                .{NotificationGroupView/notificationGroup}
                .{NotificationGroup/type}
                .{=}
                    sms
            .{then}
                /sms/static/img/sms_failure.svg
            .{else}
                @original
`;
