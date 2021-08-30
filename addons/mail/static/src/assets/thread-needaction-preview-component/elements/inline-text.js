/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            inlineText
        [Element/model]
            ThreadNeedactionPreviewComponent
        [web.Element/tag]
            span
        [Record/traits]
            ThreadNeedactionPreviewComponent/coreItem
            NotificationListItemComponent/inlineText
        [web.Element/style]
            {if}
                @record
                .{ThreadNeedactionPreviewComponent/inlineLastNeedactionMessageBody}
                .{Collection/length}
                .{=}
                    0
            .{then}
                {web.scss/selector}
                    [0]
                        &::before
                    [1]
                        {Dev/comment}
                            AKU TODO: FIXME
                        [web.scss/content]
                            {Char/noBreakSpace}
                            {Dev/comment}
                                keep line-height as if it had content
`;
