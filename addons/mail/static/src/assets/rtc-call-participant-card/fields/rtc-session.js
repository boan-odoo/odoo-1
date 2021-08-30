/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        If set, this card represents a rtcSession.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            rtcSession
        [Field/model]
            RtcCallParticipantCard
        [Field/type]
            one
        [Field/target]
            RtcSession
`;
