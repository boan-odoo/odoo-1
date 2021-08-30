/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            selectedPartnerLabelIconSeparator
        [Element/model]
            ChannelInvitationFormComponent:selectedPartner
        [web.Element/class]
            mx-1
`;
