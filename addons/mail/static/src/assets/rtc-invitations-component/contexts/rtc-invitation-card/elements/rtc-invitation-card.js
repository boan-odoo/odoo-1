/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            rtcInvitationCard
        [Element/model]
            RtcInvitationsComponent:rtcInvitationCard
        [web.Element/target]
            RtcInvitationCardComponent
        [RtcInvitationCardComponent/thread]
            @record
            .{ RtcInvitationsComponent:rtcInvitationCard/thread}
`;
