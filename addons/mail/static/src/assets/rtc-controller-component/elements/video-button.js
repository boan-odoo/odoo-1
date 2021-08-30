/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            videoButton
        [Element/model]
            RtcControllerComponent
        [Record/traits]
            RtcControllerComponent/button
        [web.Element/style]
            {if}
                @field
                .{RtcControllerComponent/button/isActive}
            .{then}
                [web.scss/color]
                    {scss/theme-color}
                        success
`;
