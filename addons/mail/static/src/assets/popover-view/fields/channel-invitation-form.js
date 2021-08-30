/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        The record that represents the content inside the popover view.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            channelInvitationForm
        [Field/model]
            PopoverView
        [Field/type]
            one
        [Field/target]
            ChannelInvitationForm
        [Field/isCausal]
            true
        [Field/isReadonly]
            true
        [Field/inverse]
            ChannelInvitationForm/popoverViewOwner
        [Field/compute]
            {if}
                @record
                .{PopoverView/threadViewTopbarOwnerAsInvite}
            .{then}
                {Record/insert}
                    [Record/traits]
                        ChannelInvitationForm
            .{else}
                {Record/empty}
`;
