/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            onlineIcon
        [Element/model]
            ThreadIconComponent
        [Record/traits]
            ThreadIconComponent/online
        [web.Element/class]
            fa
            fa-circle
        [Element/isPresent]
            @record
            .{ThreadIconComponent/thread}
            .{Thread/orderedOtherTypingMembers}
            .{Collection/length}
            .{=}
                0
            .{&}
                @record
                .{ThreadIconComponent/thread}
                .{Thread/correspondent}
                .{Partner/imStatus}
                .{=}
                    online
        [web.Element/title]
            {Locale/text}
                Online
`;
