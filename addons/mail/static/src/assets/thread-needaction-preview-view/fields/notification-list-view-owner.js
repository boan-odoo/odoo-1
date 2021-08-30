/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            notificationListViewOwner
        [Field/model]
            ThreadNeedactionPreviewView
        [Field/type]
            one
        [Field/target]
            NotificationListView
        [Field/isReadonly]
            true
        [Field/isRequired]
            true
        [Field/inverse]
            NotificationListView/threadNeedactionPreviewViews
`;
