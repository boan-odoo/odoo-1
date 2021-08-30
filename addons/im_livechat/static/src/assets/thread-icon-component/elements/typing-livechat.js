/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            typingLivechat
        [Element/feature]
            im_livechat
        [Element/model]
            ThreadIconComponent
        [Field/target]
            ThreadTypingIconComponent
        [Record/traits]
            ThreadTypingIcon/typing
        [Element/isPresent]
            @record
            .{ThreadIconComponent/thread}
            .{Thread/channelType}
            .{=}
                livechat
            .{&}
                @record
                .{ThreadIconComponent/thread}
                .{Thread/orderedOtherTypingMembers}
                .{Collection/length}
                .{>}
                    0
        [ThreadTypingIconComponent/animation]
            pulse
        [ThreadTypingIconComponent/title]
            @record
            .{ThreadIconComponent/thread}
            .{Thread/typingStatusText}
`;
