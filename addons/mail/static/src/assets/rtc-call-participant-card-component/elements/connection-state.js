/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            connectionState
        [Element/model]
            RtcCallParticipantCardComponent
        [Record/traits]
            RtcCallParticipantCardComponent/overlayTopElement
        [Element/isPresent]
            @record
            .{RtcCallParticipantCardComponent/callParticipantCard}
            .{RtcCallParticipantCard/rtcSession}
            .{RtcSession/channel}
            .{Thread/rtc}
            .{&}
                @record
                .{RtcCallParticipantCardComponent/callParticipantCard}
                .{RtcCallParticipantCard/rtcSession}
                .{RtcSession/rtc}
                .{isFalsy}
            .{&}
                {Record/insert}
                    [Record/traits]
                        Collection
                    connected
                    completed
                .{Collection/includes}
                    @record
                    .{RtcCallParticipantCardComponent/callParticipantCard}
                    .{RtcCallParticipantCard/rtcSession}
                    .{RtcSession/connectionState}
                .{isFalsy}
        [web.Element/title]
            @record
            .{RtcCallParticipantCardComponent/callParticipantCard}
            .{RtcCallParticipantCard/rtcSession}
            .{RtcSession/connectionState}
        [web.Element/aria-label]
            @record
            .{RtcCallParticipantCardComponent/callParticipantCard}
            .{RtcCallParticipantCard/rtcSession}
            .{RtcSession/connectionState}
`;
