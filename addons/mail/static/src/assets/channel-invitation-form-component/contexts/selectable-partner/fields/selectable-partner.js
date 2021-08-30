/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            selectablePartner
        [Field/model]
            ChannelInvitationFormComponent:selectablePartner
        [Field/type]
            one
        [Field/target]
            Partner
        [Field/isRequired]
            true
`;
