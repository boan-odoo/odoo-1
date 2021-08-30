/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            content
        [Element/model]
            PopoverViewComponent
        [Field/target]
            @record
            .{PopoverViewComponent/popoverView}
            .{PopoverView/contentComponentName}
        {entry}
            [key]
                @record
                .{PopoverViewComponent/popoverView}
                .{PopoverView/contentComponentName}
                .{+}
                    /
                .{+}
                    {if}
                        @record
                        .{PopoverViewComponent/popoverView}
                        .{PopoverView/content}
                        .{Model/traits}
                        .{has}
                            ChannelInvitationForm
                    .{then}
                        channelInvitationForm
                    .{else}
                        emojiListView
            [value]
                @record
                .{PopoverViewComponent/popoverView}
                .{PopoverView/content}
        [web.Element/style]
            {if}
                @record
                .{PopoverViewComponent/popoverView}
                .{PopoverView/content}
                .{Model/traits}
                .{has}
                    ChannelInvitationForm
            .{then}
                [web.scss/width]
                    {web.scss/Min}
                        95vw
                        400px
                [web.scss/max-height]
                    {web.scss/Min}
                        [0]
                            {web.scss/calc}
                                100vh
                                .{-}
                                    140px
                        [1]
                            530px
`;
