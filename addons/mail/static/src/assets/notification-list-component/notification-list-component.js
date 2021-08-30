/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            NotificationListComponent
        [Model/fields]
            notificationListView
        [Model/template]
            root
                noConversation
                groupForeach
        [Model/actions]
            NotificationListComponent/_getThreads
            NotificationListComponent/_loadPreviews
        [Model/lifecycles]
            onMounted
`;
