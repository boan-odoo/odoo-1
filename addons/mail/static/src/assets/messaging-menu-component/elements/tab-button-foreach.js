/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            tabButtonForeach
        [Element/model]
            MessagingMenuComponent
        [Record/traits]
            Foreach
        [Field/target]
            MessagingMenuComponent:tabButton
        [MessagingMenuComponent:tabButton/tabId]
            @field
            .{Foreach/get}
                tabId
        [Element/isPresent]
            {Device/isMobile}
            .{isFalsy}
        [Foreach/collection]
            all
            chat
            channel
        [Foreach/as]
            tabId
        [Element/key]
            @field
            .{Foreach/get}
                tabId
`;
