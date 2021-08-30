/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            micButtonIcon
        [Element/model]
            RtcControllerComponent
        [Record/traits]
            RtcControllerComponent/buttonIcon
        [web.Element/class]
            {if}
                {Rtc/currentRtcSession}
                .{RtcSession/isMute}
            .{then}
                oi-microphone--off--filled
                text-danger
            .{else}
                oi-microphone--filled
`;
