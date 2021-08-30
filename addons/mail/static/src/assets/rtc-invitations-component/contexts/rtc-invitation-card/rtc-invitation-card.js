/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Context
        [Context/name]
            rtcInvitationCard
        [Context/name]
            RtcInvitationsComponent
        [Model/fields]
            thread
        [Model/template]
            rtcInvitationCardForeach
                rtcInvitationCard
`;
