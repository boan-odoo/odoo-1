/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            outputIndicator
        [Element/model]
            RtcActivityNoticeComponent
        [web.Element/tag]
            i
        [web.Element/class]
            oi
            oi-lg
            {if}
                {Rtc/sendDisplay}
                .{isFalsy}
                .{&}
                    {Rtc/sendUserVideo}
                    .{isFalsy}
            .{then}
                oi-phone--voice
            {if}
                {Rtc/sendUserVideo}
            .{then}
                oi-video
            {if}
                {Rtc/sendDisplay}
            .{then}
                oi-screen
        [web.Element/style]
            [web.scss/margin-inline-end]
                {scss/map-get}
                    {scss/$spacers}
                    2
`;
