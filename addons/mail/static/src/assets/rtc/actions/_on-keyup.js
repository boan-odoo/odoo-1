/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Rtc/_onKeyup
        [Action/params]
            ev
                [type]
                    KeyboardEvent
            record
                [type]
                    Rtc
        [Action/behavior]
            {if}
                @record
                .{Rtc/channel}
                .{isFalsy}
            .{then}
                {break}
            {if}
                {Env/userSetting}
                .{UserSetting/usePushToTalk}
                .{isFalsy}
                .{|}
                    {UserSetting/isPushToTalkKey}
                        [0]
                            {Env/userSetting}
                        [1]
                            @ev
                        [2]
                            [ignoreModifiers]
                                @true
                    .{isFalsy}
                {break}
            {if}
                {Rtc/currentRtcSession}
                .{RtcSession/isTalking}
                .{isFalsy}
            .{then}
                {break}
            {if}
                {Rtc/currentRtcSession}
                .{RtcSession/isMute}
                .{isFalsy}
            .{then}
                {SoundEffect/play}
                    {SoundEffects/pushToTalkOff}
            {Record/update}
                [0]
                    @record
                [1]
                    [Rtc/_pushToTalkTimeoutId]
                        {Browser/setTimeout}
                            [0]
                                {Rtc/_setSoundBroadcast}
                                    false
                            [1]
                                {Env/userSetting}
                                .{UserSetting/voiceActiveDuration}
                                .{|}
                                    0
`;
