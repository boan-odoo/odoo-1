/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            headphoneIcon
        [Element/model]
            RtcCallParticipantCardComponent
        [web.Element/tag]
            i
        [web.Element/class]
            oi
            oi-volume--mute--filled
`;
