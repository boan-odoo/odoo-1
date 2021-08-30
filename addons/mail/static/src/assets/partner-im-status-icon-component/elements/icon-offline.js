/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            iconOffline
        [Element/model]
            PartnerImStatusIconComponent
        [Record/traits]
            PartnerImStatusIconComponent/icon
        [web.Element/class]
            fa
            fa-circle-o
            fa-stack-1x
        [Element/isPresent]
            @record
            .{PartnerImStatusIconComponent/partner}
            .{Partner/imStatus}
            .{=}
                offline
        [web.Element/title]
            {Locale/text}
                Offline
        [web.Element/role]
            img
        [web.Element/aria-label]
            {Locale/text}
                User is offline
`;
