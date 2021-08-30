/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Updates the track that is broadcasted to the RTCPeerConnection.
        This will start new transaction by triggering a negotiationneeded event
        on the peerConnection given as parameter.

        negotiationneeded -> offer -> answer -> ...
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Rtc/_updateRemoteTrack
        [Action/params]
            peerConnection
                [type]
                    RTCPeerConnection
            trackKind
                [type]
                    String
            initTransceiver
                [type]
                    Boolean
            token
                [type]
                    String
            record
                [type]
                    Rtc
        [Action/behavior]
            {Rtc/_addLogEntry}
                [0]
                    @record
                [1]
                    @token
                [2]
                    updating 
                    .{+}
                        @trackKind
                    .{+}
                         transceiver
            :track
                {if}
                    @trackKind
                    .{=}
                        audio
                .{then}
                    @record
                    .{Rtc/audioTrack}
                .{else}
                    @record
                    .{Rtc/videoTrack}
            :fullDirection
                {if}
                    @track
                .{then}
                    sendrecv
                .{else}
                    recvonly
            :limitedDirection
                {if}
                    @track
                .{then}
                    sendonly
                .{else}
                    inactive
            :transceiverDirection
                @fullDirection
            {if}
                @trackKind
                .{=}
                    video
            .{then}
                :focusedToken
                    {Env/focusedRtcSession}
                    .{&}
                        {Env/focusedRtcSession}
                        .{RtcSession/peerToken}
                :transceiverDirection
                    @focusedToken
                    .{isFalsy}
                    .{|}
                        {if}
                            @focusedToken
                            .{=}
                                @token
                        .{then}
                            @fullDirection
                        .{else}
                            @limitedDirection
            :transceiver
                {if}
                    @initTransceiver
                .{then}
                    {RTCPeerConnection/addTransceiver}
                        [0]
                            @peerConnection
                        [1]
                            @trackKind
                .{else}
                    {Rtc/_getTransceiver}
                        [0]
                            @record
                        [1]
                            @peerConnection
                        [2]
                            @trackKind
            {if}
                @track
            .{then}
                {try}
                    {TransceiverSender/replaceTrack}
                        [0]
                            @transceiver
                            .{Transceiver/sender}
                        [1]
                            @track
                    {Record/update}
                        [0]
                            @transceiver
                        [1]
                            [Transceiver/direction]
                                @transceiverDirection
                .{catch}
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            error
                        [Function/out]
                            {Dev/comment}
                                ignored, the track is probably already on the peerConnection.
                {break}
            {try}
                {TransceiverSender/replaceTrack}
                    [0]
                        @transceiver
                        .{Transceiver/sender}
                    [1]
                        null
                {Record/update}
                    [0]
                        @transceiver
                    [1]
                        [Transceiver/direction]
                            @transceiverDirection
            .{catch}
                {Record/insert}
                    [Record/traits]
                        Function
                    [Function/in]
                        error
                    [Function/out]
                        {Dev/comment}
                            ignored, the transceiver is probably already removed
            {if}
                @trackKind
                .{=}
                    video
            .{then}
                {Rtc/_notifyPeers}
                    [0]
                        @record
                    [1]
                        @token
                    [2]
                        [event]
                            trackChange
                        [type]
                            peerToPeer
                        [payload]
                            [type]
                                video
                            [state]
                                [isSendingVideo]
                                    false
`;
