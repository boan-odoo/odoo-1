/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Searches for partners to invite based on the current
        search term. If a search is already in progress, waits
        until it is done to start a new one.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            ChannelInvitationForm/searchPartnersToInvite
        [Action/params]
            record
        [Action/behavior]
            {if}
                @record
                .{ChannelInvitationForm/hasSearchRpcInProgress}
            .{then}
                {Record/update}
                    [0]
                        @record
                    [1]
                        [ChannelInvitationForm/hasPendingSearchRpc]
                            true
                {break}
            {Record/update}
                [0]
                    @record
                [1]
                    [ChannelInvitationForm/hasPendingSearchRpc]
                        false
                    [ChannelInvitationForm/hasSearchRpcInProgress]
                        true
            {try}
                :data
                    @env
                    .{Env/owlEnv}
                    .{Dict/get}
                        services
                    .{Dict/get}
                        rpc
                    .{Function/call}
                        [0]
                            [model]
                                res.partner
                            [method]
                                search_for_channel_invite
                            [kwargs]
                                [channel_id]
                                    {if}
                                        @record
                                        .{ChannelInvitationForm/thread}
                                        .{&}
                                            @record
                                            .{ChannelInvitationForm/thread}
                                            .{Thread/model}
                                            .{=}
                                                mail.channel
                                    .{then}
                                        @record
                                        .{ChannelInvitationForm/thread}
                                        .{Thread/id}
                                    .{else}
                                        undefined
                                [search_term]
                                    {UI/cleanSearchTerm}
                                        @record
                                        .{ChannelInvitationForm/searchTerm}
                        [1]
                            [shadow]
                                true
                {if}
                    {Record/exists}
                        @record
                    .{isFalsy}
                .{then}
                    {break}
                {Record/update}
                    [0]
                        @record
                    [1]
                        [ChannelInvitationForm/searchResultCount]
                            @data
                            .{Dict/get}
                                count
                        [ChannelInvitationForm/selectablePartners]
                            @data
                            .{Dict/get}
                                partners
                            .{Collection/map}
                                {Record/insert}
                                    [Record/traits]
                                        Function
                                    [Function/in]
                                        item
                                    [Function/out]
                                        {Record/insert}
                                            [Record/traits]
                                                Partner
                                            {Partner/convertData}
                                                @item
            .{finally}
                {if}
                    {Record/exists}
                        @record
                    .{isFalsy}
                .{then}
                    {break}
                {Record/update}
                    [0]
                        @record
                    [1]
                        [ChannelInvitationForm/hasSearchRpcInProgress]
                            false
                {if}
                    @record
                    .{ChannelInvitationForm/hasPendingSearchRpc}
                .{then}
                    {ChannelInvitationForm/searchPartnersToInvite}
                        @record
`;
