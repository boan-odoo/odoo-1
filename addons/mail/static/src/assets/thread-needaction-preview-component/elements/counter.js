/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            counter
        [Element/model]
            ThreadNeedactionPreviewComponent
        [web.Element/tag]
            span
        [Record/traits]
            NotificationListItemComponent/bold
            NotificationListItemComponent/counter
        [web.Element/textContent]
            {String/sprintf}
                [0]
                    {Locale/text}
                        (%s)
                [1]
                    @record
                    .{ThreadNeedactionPreviewComponent/threadNeedactionPreviewView}
                    .{ThreadNeedactionPreviewView/thread}
                    .{Thread/needactionMessagesAsOriginThread}
                    .{Collection/length}
`;
