/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            channelPublic
        [Element/model]
            ThreadIconComponent
        [web.Element/class]
            fa
            fa-hashtag
        [Element/isPresent]
            @record
            .{ThreadIconComponent/thread}
            .{Thread/channelType}
            .{=}
                channel
            .{&}
                @record
                .{ThreadIconComponent/thread}
                .{Thread/public}
                .{!=}
                    private
        [web.Element/title]
            {Locale/text}
                Public channel
`;
