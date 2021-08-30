/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            messagingMenuOwner
        [Field/model]
            NotificationListView
        [Field/type]
            one
        [Field/target]
            MessagingMenu
        [Field/isReadonly]
            true
        [Field/inverse]
            MessagingMenu/notificationListView
`;
