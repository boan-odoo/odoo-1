/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            mailboxInbox
        [Element/model]
            DiscussSidebarComponent
        [Field/target]
            DiscussSidebarMailboxComponent
        [DiscussSidebarMailboxComponent/thread]
            {Env/inbox}
`;
