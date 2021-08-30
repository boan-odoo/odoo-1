/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            hiddenMenu
        [Element/model]
            ChatWindowManagerComponent
        [Field/target]
            ChatWindowHiddenMenuComponent
        [Element/isPresent]
            {Messaging/isInitialized}
            .{&}
                {ChatWindowManager/hasHiddenChatWindows}
`;
