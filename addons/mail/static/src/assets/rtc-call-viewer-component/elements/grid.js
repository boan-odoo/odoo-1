/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            grid
        [Element/model]
            RtcCallViewerComponent
        [Element/isPresent]
            @record
            .{RtcCallViewerComponent/rtcCallViewer}
            .{RtcCallViewer/layout}
            .{!=}
                spotlight
        [web.Element/style]
            [web.scss/height]
                100%
            [web.scss/display]
                flex
            [web.scss/flex-direction]
                column
            [web.scss/align-items]
                center
            [web.scss/overflow-y]
                auto
            [web.scss/overflow-x]
                hidden
            {web.scss/selector}
                [0]
                    &::-webkit-scrollbar
                [1]
                    [web.scss/width]
                        0.3vw
        {if}
            @record
            .{RtcCallViewerComponent/rtcCallViewer}
            .{RtcCallViewer/layout}
            .{=}
                tiled
        .{then}
            [web.scss/flex-direction]
                row
            [web.scss/width]
                100%
            [web.scss/overflow-y]
                hidden
            [web.scss/flex-wrap]
                wrap
            [web.scss/justify-content]
                center
        {if}
            @record
            .{RtcCallViewerComponent/rtcCallViewer}
            .{RtcCallViewer/layout}
            .{=}
                sidebar
        .{then}
            [web.scss/width]
                120
                px
            [web.scss/min-width]
                120
                px
        {web.scss/selector}
            [0]
                &::-webkit-scrollbar
            [1]
                [web.scss/background]
                    {scss/gray}
                        900
        {web.scss/selector}
            [0]
                &::-webkit-scrollbar-thumb
            [1]
                [web.scss/background]
                    {scss/gray}
                        700
`;
