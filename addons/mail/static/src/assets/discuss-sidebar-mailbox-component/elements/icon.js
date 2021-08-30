/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            icon
        [Element/model]
            DiscussSidebarMailboxComponent
        [Record/traits]
            DiscussSidebarMailboxComponent/item
        [Field/target]
            ThreadIconComponent
        [ThreadIconComponent/thread]
            @record
            .{DiscussSidebarMailboxComponent/mailbox}
`;
