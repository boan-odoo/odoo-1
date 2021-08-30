/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Context
        [Context/name]
            button
        [Context/model]
            DiscussMobileMailboxSelectionComponent
        [Model/fields]
            mailbox
        [Model/template]
            buttonForeach
                button
`;
