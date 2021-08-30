/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            channelInvitationForm
        [Field/model]
            ChannelInvitationFormComponent
        [Field/type]
            one
        [Field/target]
            ChannelInvitationForm
        [Field/inverse]
            ChannelInvitationForm/channelInvitationFormComponents
        [Field/isRequired]
            true
`;