/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            manager
        [Field/model]
            ChatWindow
        [Field/type]
            one
        [Field/target]
            ChatWindowManager
        [Field/inverse]
            ChatWindowManager/chatWindows
        [Field/isReadonly]
            true
`;
