/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            DiscussMobileMailboxSelectionComponent
        [Model/fields]
            discuss
        [Model/template]
            root
                buttonForeach
        [Model/actions]
            DiscussMobileMailboxSelectionComponent/getOrderedMailboxes
`;
