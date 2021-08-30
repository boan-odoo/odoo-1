/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Context
        [Context/name]
            listItem
        [Context/model]
            ChatWindowHiddenMenuComponent
        [Model/fields]
            chatWindow
        [Model/template]
            listItemForeach
                listItem
                    chatWindowHeader
`;
