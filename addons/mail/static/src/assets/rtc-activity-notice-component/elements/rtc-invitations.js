/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            rtcInvitations
        [Element/model]
            RtcActivityNoticeComponent
        [Field/target]
            RtcInvitationsComponent
`;
