/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            micButton
        [Element/model]
            RtcControllerComponent
        [Record/traits]
            RtcControllerComponent/button
        [Element/isPresent]
            @record
            .{RtcControllerComponent/rtcController}
            .{RtcController/callViewer}
            .{RtcCallViewer/threadView}
            .{TreadView/thread}
            .{Thread/rtc}
            .{&}
                {Rtc/currentRtcSession}
        [RtcControllerComponent/button/isActive]
            {Rtc/currentRtcSession}
            .{RtcSession/isMute}
            .{isFalsy}
        [web.Element/aria-label]
            {if}
                {Rtc/currentRtcSession}
                .{RtcSession/isMute}
            .{then}
                {Locale/text}
                    Unmute
            .{else}
                {Locale/text}
                    Mute
        [web.Element/title]
            {if}
                {Rtc/currentRtcSession}
                .{RtcSession/isSelfMuted}
            .{then}
                {Locale/text}
                    Unmute
            .{else}
                {Locale/text}
                    Mute
        [Element/onClick]
            {RtcController/onClickMicrophone}
                [0]
                    {Rtc/currentRtcSession}
                [1]
                    @ev
`;
