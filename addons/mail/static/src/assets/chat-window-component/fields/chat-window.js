/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            chatWindow
        [Field/model]
            ChatWindowComponent
        [Field/type]
            one
        [Field/target]
            ChatWindow
        [Field/isRequired]
            true
`;
