/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            failureNotifications
        [Field/model]
            Message
        [Field/type]
            many
        [Field/target]
            Notification
        [Field/compute]
            @record
            .{Message/notifications}
            .{Collection/filter}
                {Record/insert}
                    [Record/traits]
                        Function
                    [Function/in]
                        item
                    [Function/out]
                        @item
                        .{Notification/isFailure}
`;
