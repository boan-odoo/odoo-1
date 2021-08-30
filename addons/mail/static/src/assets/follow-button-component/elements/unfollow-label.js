/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            unfollowLabel
        [Element/model]
            FollowButtonComponent
        [web.Element/tag]
            span
        [Element/isPresent]
            @record
            .{FollowButtonComponent/isUnfollowButtonHighlighted}
        [web.Element/textContent]
            {Locale/text}
                Unfollow
`;
