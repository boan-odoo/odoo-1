/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Rtc/filterIncomingVideoTraffic
        [Action/params]
            allowedTokens
                [type]
                    Collection
                [description]
                    tokens of the peerConnections for which the incoming video
                    traffic is allowed. If undefined, all traffic is allowed.
            record
                [type]
                    Rtc
        [Action/behavior]
            :tokenSet
                {Record/insert}
                    [Record/traits]
                        Set
                    @allowedTokens
            {foreach}
                @record
                .{Rtc/_peerConnections}
            .{as}
                item
            .{do}
                :token
                    @item
                    .{Collection/first}
                :peerConnection
                    @item
                    .{Collection/second}
                :fullDirection
                    {if}
                        @record
                        .{Rtc/videoTrack}
                    .{then}
                        sendrecv
                    .{else}
                        recvonly
                :limitedDirection
                    {if}
                        @record
                        .{Rtc/videoTrack}
                    .{then}
                        sendonly
                    .{else}
                        inactive
                :transceiver
                    {Rtc/_getTransceiver}
                        [0]
                            @record
                        [1]
                            @peerConnection
                        [2]
                            video
                {if}
                    @transceiver
                    .{isFalsy}
                .{then}
                    {continue}
                {if}
                    @tokenSet
                    .{Set/size}
                    .{=}
                        0
                    .{|}
                        {Set/has}
                            [0]
                                @tokenSet
                            [1]
                                @token
                .{then}
                    {Record/update}
                        [0]
                            @transceiver
                        [1]
                            [Transceiver/direction]
                                @fullDirection
                .{else}
                    {Record/update}
                        [0]
                            @transceiver
                        [1]
                            [Transceiver/direction]
                                @limitedDirection
`;
