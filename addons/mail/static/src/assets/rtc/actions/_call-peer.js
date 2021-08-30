/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Rtc/_callPeer
        [Action/params]
            token
                [type]
                    String
            record
                [type]
                    Rtc
        [Action/behavior]
            :peerConnection
                {Rtc/_createPeerConnection}
                    [0]
                        @record
                    [1]
                        @token
            {foreach}
                @record
                .{Rtc/transceiverOrder}
            .{as}
                trackKind
            .{do}
                {Rtc/_updateRemoteTrack}
                    [0]
                        @record
                    [1]
                        @peerConnection
                    [1]
                        @trackKind
                    [2]
                        [initTransceiver]
                            true
                        [token]
                            @token
            {Set/add}
                [0]
                    @record
                    .{Rtc/_outGoingCallTokens}
                [1]
                    @token
`;
