/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            headphoneButtonIcon
        [Element/model]
            RtcControllerComponent
        [Record/traits]
            RtcControllerComponent/buttonIcon
        [web.Element/class]
            {if}
                {Rtc/currentRtcSession}
                .{RtcSession/isDeaf}
            .{then}
                oi-volume--mute--filled
            .{else}
                oi-volume--up--filled
`;
