/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            channelMemberList
        [Element/model]
            ChatWindowComponent
        [Field/target]
            ChannelMemberListComponent
        [Element/isPresent]
            @record
            .{ChatWindowComponent/chatWindow}
            .{ChatWindow/thread}
            .{Thread/hasMemberListFeature}
            .{&}
                @record
                .{ChatWindowComponent/chatWindow}
                .{ChatWindow/isMemberListOpened}
        [ChannelMemberListComponent/channel]
            @record
            .{ChatWindowComponent/chatWindow}
            .{ChatWindow/thread}
        [web.Element/class]
            bg-white
`;
