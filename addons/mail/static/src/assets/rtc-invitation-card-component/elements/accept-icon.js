/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            acceptIcon
        [Element/model]
            RtcInvitationCardComponent
        [Record/traits]
            RtcInvitationCardComponent/buttonIcon
        [web.Element/class]
            fa-phone
`;
