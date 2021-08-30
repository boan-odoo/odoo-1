/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        updates the record and notifies the server of the change
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            RtcSession/updateAndBroadcast
        [Action/params]
            data
                [type]
                    Object
            record
                [type]
                    RtcSession
        [Action/behavior]
            {if}
                @record
                .{RtcSession/rtc}
                .{isFalsy}
            .{then}
                {break}
            {Record/update}
                [0]
                    @record
                [1]
                    @data
            {RtcSession/_debounce}
                [0]
                    {if}
                        {Record/exists}
                            @record
                        .{isFalsy}
                    .{then}
                        {break}
                    {Record/doAsync}
                        [0]
                            @record
                        [1]
                            @env
                            .{Env/owlEnv}
                            .{Dict/get}
                                services
                            .{Dict/get}
                                rpc
                            .{Function/call}
                                [0]
                                    [route]
                                        /mail/rtc/session/update_and_broadcast
                                    [params]
                                        [session_id]
                                            @record
                                            .{RtcSession/id}
                                        [values]
                                            [is_camera_on]
                                                @record
                                                .{RtcSession/isCameraOn}
                                            [is_deaf]
                                                @record
                                                .{RtcSession/isDeaf}
                                            [is_muted]
                                                @record
                                                .{RtcSession/isSelfMuted}
                                            [is_screen_sharing_on]
                                                @record
                                                .{RtcSession/isScreenSharingOn}
                                [1]
                                    [shadow]
                                        true
                [1]
                    3000
`;
