/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            buttonIcon
        [Element/model]
            RtcControllerComponent
        [web.Element/tag]
            i
        [web.Element/class]
            oi
            {if}
                @record
                .{RtcControllerComponent/rtcController}
                .{RtcController/isSmall}
                .{isFalsy}
            .{then}
                oi-lg
`;
