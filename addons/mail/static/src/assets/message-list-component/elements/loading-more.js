/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            loadingMore
        [Element/model]
            MessageListComponent
        [Record/traits]
            MessageListComponent/item
        [Element/isPresent]
            @record
            .{MessageListComponent/messageListView}
            .{MessageListView/threadViewOwner}
            .{ThreadView/threadCache}
            .{ThreadCache/isLoadingMore}
        [web.Element/style]
            [web.scss/align-self]
                center
`;
