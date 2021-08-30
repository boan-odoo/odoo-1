/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            mic
        [Element/model]
            RtcCallParticipantCardComponent
        [Record/traits]
            RtcCallParticipantCardComponent/overlayTopElement
        [Element/isPresent]
            @record
            .{RtcCallParticipantCardComponent/callParticipantCard}
            .{RtcCallParticipantCard/rtcSession}
            .{RtcSession/isSelfMuted}
            .{&}
                @record
                .{RtcCallParticipantCardComponent/callParticipantCard}
                .{RtcCallParticipantCard/rtcSession}
                .{RtcSession/isDeaf}
                .{isFalsy}
        [web.Element/title]
            {Locale/text}
                muted
        [web.Element/aria-label]
            {Locale/text}
                muted
`;
