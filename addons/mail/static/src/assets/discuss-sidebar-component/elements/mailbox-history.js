/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            mailboxHistory
        [Element/model]
            DiscussSidebarComponent
        [Field/target]
            DiscussSidebarMailboxComponent
        [DiscussSidebarMailboxComponent/thread]
            {Env/history}
`;
