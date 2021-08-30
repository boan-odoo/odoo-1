/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            tabForeach
        [Element/model]
            MobileMessagingNavbarComponent
        [Record/traits]
            Foreach
        [Foreach/collection]
            @record
            .{MobileMessagingNavbarComponent/mobileMessagingNavbarView}
            .{MobileMessagingNavbarView/tabs}
        [Foreach/as]
            tab
        [Element/key]
            @record
            .{Foreach/get}
                tab
            .{Tab/id}
        [Field/target]
            MobileMessagingNavbarComponent:tab
        [MobileMessagingNavbarComponent:tab/tab]
            @record
            .{Foreach/get}
                tab
`;
