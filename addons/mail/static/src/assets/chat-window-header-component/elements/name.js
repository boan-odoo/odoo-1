/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            name
        [Element/model]
            ChatWindowHeaderComponent
        [Record/traits]
            ChatWindowHeaderComponent/tem
        [web.Element/class]
            text-truncate
        [web.Element/title]
            @record
            .{ChatWindowHeaderComponent/chatWindow}
            .{ChatWindow/name}
        [web.Element/textContent]
            @record
            .{ChatWindowHeaderComponent/chatWindow}
            .{ChatWindow/name}
        [web.Element/style]
            [web.scss/max-height]
                {scss/map-get}
                    {scss/$sizes}
                    100
            [web.scss/user-select]
                none
`;
