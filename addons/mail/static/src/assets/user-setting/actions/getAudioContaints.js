/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            UserSetting/getAudioContaints
        [Action/params]
            record
                [type]
                    UserSetting
        [Action/returns]
            Object
                [description]
                    MediaTrackConstraints
        [Action/behavior]
            :constraints
                {Record/insert}
                    [Record/traits]
                        Object
                    [echoCancellation]
                        true
                    [noiseSuppression]
                        true
            {if}
                @record
                .{UserSetting/audioInputDeviceId}
            .{then}
                {Record/update}
                    [0]
                        @constraints
                    [1]
                        [deviceId]
                            @record
                            .{UserSetting/audioInputDeviceId}
            @constraints
`;
