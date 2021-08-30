/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            selectedPartner
        [Element/model]
            ChannelInvitationFormComponent
        [Record/traits]
            Foreach
        [Foreach/collection]
            @record
            .{ChannelInvitationFormComponent/channelInvitationForm}
            .{ChannelInvitationForm/selectedPartners}
        [Foreach/as]
            selectedPartner
        [Foreach/key]
            @field
            .{Foreach/get}
                selectedPartner
            .{Record/id}
        [Field/target]
            ChannelInvitationFormComponent:selectedPartner
        [ChannelInvitationFormComponent:selectedPartner/selectedPartner]
            @field
            .{Foreach/get}
                selectedPartner
`;
