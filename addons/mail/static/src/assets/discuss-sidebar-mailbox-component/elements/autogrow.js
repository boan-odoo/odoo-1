/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            autogrow
        [Element/model]
            DiscussSidebarMailboxComponent
        [Record/traits]
            AutogrowComponent
            DiscussSidebarMailboxComponent/item
`;
