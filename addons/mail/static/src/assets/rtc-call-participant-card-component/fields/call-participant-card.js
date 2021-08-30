/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            callParticipantCard
        [Field/model]
            RtcCallParticipantCardComponent
        [Field/type]
            one
        [Field/target]
            RtcCallParticipantCard
        [Field/isRequired]
            true
`;
