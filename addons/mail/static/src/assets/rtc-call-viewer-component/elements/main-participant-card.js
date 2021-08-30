/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            mainParticipantCard
        [Element/model]
            RtcCallViewerComponent
        [Element/isPresent]
            @record
            .{RtcCallViewerComponent/rtcCallViewer}
            .{RtcCallViewer/mainParticipantCard}
        [Record/traits]
            RtcCallViewerComponent/participantCard
        [web.Element/target]
            RtcCallParticipantCardComponent
        [RtcCallParticipantCardComponent/callParticipantCard]
            @record
            .{RtcCallViewerComponent/rtcCallViewer}
            .{RtcCallViewer/mainParticipantCard}
        [web.Element/class]
            w-100
`;
