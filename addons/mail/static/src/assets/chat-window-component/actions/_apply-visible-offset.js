/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Apply visual position of the chat window.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            ChatWindowComponent/_applyVisibleOffset
        [Action/params]
            record
        [Action/behavior]
            :textDirection
                {Locale/textDirection}
            :offsetFrom
                {if}
                    @textDirection.
                    {=}
                        rtl
                .{then}
                    left
                .{else}
                    right
            :oppositeFrom
                {if}
                    @offsetFrom
                    .{=}
                        right
                .{then}
                    left
                .{else}
                    right
            {Record/update}
                [0]
                    @record
                    .{ChatWindowComponent/root}
                [1]
                    {entry}
                        [key]
                            web.scss/
                            .{+}
                                @offsetFrom
                        [value]
                            @record
                            .{ChatWindowComponent/chatWindow}
                            .{ChatWindow/visibleOffset}
                            .{+}
                                px
                    {entry}
                        [key]
                            web.scss/
                            .{+}
                                @oppositeFrom
                        [value]
                            auto
`;
