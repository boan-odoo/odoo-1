/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            selectablePartnerForeach
        [Element/model]
            ChannelInvitationFormComponent
        [Model/trait]
            Foreach
        [Foreach/collection]
            @record
            .{ChannelInvitationFormComponent/channelInvitationForm}
            .{ChannelInvitationForm/selectablePartners}
        [Foreach/as]
            selectablePartner
        [Field/target]
            ChannelInvitationFormComponent:selectablePartner
        [ChannelInvitationFormComponent:selectablePartner/selectablePartner]
            @field
            .{Foreach/get}
                selectablePartner
        [Element/key]
            @field
            .{Foreach/get}
                selectablePartner
            .{Record/id}
`;
