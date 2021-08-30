/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            DiscussSidebarMailboxComponent
        [Model/fields]
            mailbox
        [Model/template]
            root
                icon
                name
                autogrow
                counter
`;
