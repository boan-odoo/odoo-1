/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            chatWindow
        [Context/model]
            ChatWindowHiddenMenuComponent:listItem
        [Field/type]
            one
        [Field/target]
            ChatWindow
        [Field/isRequired]
            true
`;
