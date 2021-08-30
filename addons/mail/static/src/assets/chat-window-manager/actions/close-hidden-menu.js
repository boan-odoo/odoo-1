/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            ChatWindowManager/closeHiddenMenu
        [Action/params]
            chatWindowManager
        [Action/behavior]
            {Record/update}
                [0]
                    @chatWindowManager
                [1]
                    [ChatWindowManager/isHiddenMenuOpen]
                        false
`;
