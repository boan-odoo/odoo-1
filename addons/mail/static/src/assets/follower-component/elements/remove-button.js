/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            removeButton
        [Element/model]
            FollowerComponent
        [web.Element/tag]
            button
        [Record/traits]
            FollowerComponent/button
        [web.Element/class]
            btn
            btn-icon
        [Element/isPresent]
            @record
            .{FollowerComponent/follower}
            .{Follower/isEditable}
        [web.Element/title]
            {Locale/text}
                Remove this follower
        [Element/onClick]
            {Follower/remove}
                @record
                .{FollowerComponent/follower}
`;
