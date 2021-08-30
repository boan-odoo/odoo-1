/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            details
        [Element/model]
            FollowerComponent
        [web.Element/tag]
            a
        [Record/traits]
            Hoverable
        [web.Element/class]
            d-flex
        [Element/isPresent]
            @record
            .{FollowerComponent/follower}
        [web.Element/href]
            #
        [Element/onClick]
            {web.Event/preventDefault}
                @ev
            {web.Event/stopPropagation}
                @ev
            {Follower/openProfile}
                @record
                .{FollowerComponent/follower}
        [web.Element/style]
            [web.scss/align-items]
                center
            [web.scss/display]
                flex
            [web.scss/flex]
                1
            [web.scss/min-width]
                0
            [web.scss/padding-left]
                {scss/map-get}
                    {scss/$spacers}
                    3
            [web.scss/padding-right]
                {scss/map-get}
                    {scss/$spacers}
                    3
            [web.scss/color]
                {scss/gray}
                    700
            {if}
                @field
                .{web.Element/isHover}
            .{then}
                [web.scss/background]
                    {scss/gray}
                        400
                [scss/color]
                    {scss/$black}
            {if}
                @record
                .{FollowerComponent/follower}
                .{Follower/isActive}
                .{isFalsy}
            .{then}
                [web.scss/opacity]
                    0.25
                [web.scss/font-style]
                    italic
`;
