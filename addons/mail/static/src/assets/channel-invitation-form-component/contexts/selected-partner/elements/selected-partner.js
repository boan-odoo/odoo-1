/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            selectedPartner
        [Element/model]
            ChannelInvitationFormComponent:selectedPartner
        [Record/traits]
            Hoverable
        [web.Element/tag]
            button
        [web.Element/class]
            btn
            btn-secondary
        [Element/onClick]
            {ChannelInvitationForm/onClickSelectedPartner}
                @record
                .{ChannelInvitationFormComponent/channelInvitationForm}
                @record
                .{ChannelInvitationFormComponent:selectedPartner/selectedPartner}
        [web.Element/style]
            {if}
                @field
                .{web.Element/isHover}
            .{then}
                [web.scss/background-color]
                    {scss/gray}
                        100
`;
