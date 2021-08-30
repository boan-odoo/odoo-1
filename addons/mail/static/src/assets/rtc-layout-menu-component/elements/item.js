/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            item
        [Element/model]
            RtcLayoutMenuComponent
        [Record/traits]
            Hoverable
        [web.Element/tag]
            label
        [web.Element/style]
            [web.scss/display]
                flex
            [web.scss/align-items]
                center
            [web.scss/justify-content]
                space-between
            [web.scss/font-size]
                1.3em
            [web.scss/cursor]
                pointer
            [web.scss/border-radius]
                5px
            {if}
                @field
                .{web.Element/isHover}
            .{then}
                [web.scss/background-color]
                    {scss/gray}
                        100
                [web.scss/box-shadow]
                    0px
                    0px
                    1px
                    1px
                    {scss/gray}
                        300
                    inset
            {if}
                @field
                .{web.Element/isActive}
            .{then}
                [web.scss/background-color]
                    {scss/gray}
                        200
                [web.scss/box-shadow]
                    0px
                    0px
                    1px
                    1px
                    {scss/gray}
                        400
                    inset
`;
