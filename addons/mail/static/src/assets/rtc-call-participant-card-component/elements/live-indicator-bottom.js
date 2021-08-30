/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            liveIndicatorBottom
        [Element/model]
            RtcCallParticipantCardComponent
        [Record/traits]
            RtcCallParticipantCardComponent/liveIndicator
        [Element/isPresent]
            @record
            .{RtcCallParticipantCardComponent/callParticipantCard}
            .{RtcCallParticipantCard/rtcSession}
            .{RtcSession/isScreenSharingOn}
            .{&}
                @record
                .{RtcCallParticipantCardComponent/callParticipantCard}
                .{RtcCallParticipantCard/isMinimized}
            .{&}
                @record
                .{RtcCallParticipantCardComponent/callParticipantCard}
                .{RtcCallParticipantCard/rtcSession}
                .{RtcSession/channel}
                .{Thread/rtc}
                .{isFalsy}
        [web.Element/style]
            [web.scss/font-size]
                0.7
                rem
`;
