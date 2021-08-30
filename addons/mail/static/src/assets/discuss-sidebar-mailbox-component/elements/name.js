/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            name
        [Element/model]
            DiscussSidebarMailboxComponent
        [Record/traits]
            DiscussSidebarMailboxComponent/item
        [web.Element/textContent]
            @record
            .{DiscussSidebarMailboxComponent/mailbox}
            .{Thread/displayName}
        [web.Element/style]
            {web.scss/include}
                {web.scss/text-truncate}
`;
