/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            micIcon
        [Element/model]
            RtcCallParticipantCardComponent
        [web.Element/tag]
            i
        [web.Element/class]
            oi
            oi-microphone--off--filled
`;
