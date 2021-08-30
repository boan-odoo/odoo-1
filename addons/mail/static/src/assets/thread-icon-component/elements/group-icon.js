/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            groupIcon
        [Element/model]
            ThreadIconComponent
        [web.Element/class]
            fa
            fa-users
        [Element/isPresent]
            @record
            .{ThreadIconComponent/thread}
            .{Thread/channelType}
            .{=}
                group
        [web.Element/title]
            {Locale/text}
                Grouped Chat
`;
