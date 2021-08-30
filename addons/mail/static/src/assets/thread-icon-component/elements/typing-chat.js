/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            typingChat
        [Element/model]
            ThreadIconComponent
        [Field/target]
            ThreadTypingIconComponent
        [Record/traits]
            ThreadIconComponent/typing
        [Element/isPresent]
            @record
            .{ThreadIconComponent/thread}
            .{&}
                @record
                .{ThreadIconComponent/thread}
                .{Thread/channelType}
                .{=}
                    chat
            .{&}
                @record
                .{ThreadIconComponent/thread}
                .{Thread/correspondent}
            .{&}
                @record
                .{ThreadIconComponent/thread}
                .{Thread/orderedOtherTypingMembers}
                .{Collection/length}
                .{>}
                    0
        [ThreadTypingIconComponent/animate]
            pulse
        [ThreadTypingIconComponent/title]
            @record
            .{ThreadIconComponent/thread}
            .{Thread/typingStatusText}
`;
