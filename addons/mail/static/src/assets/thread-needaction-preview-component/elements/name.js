/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            name
        [Element/model]
            ThreadNeedactionPreviewComponent
        [web.Element/tag]
            span
        [Record/traits]
            NotificationListItemComponent/bold
            NotificationListItemComponent/name
        [web.Element/textContent]
            @record
            .{ThreadNeedactionPreviewComponent/threadNeedactionPreviewView}
            .{ThreadNeedactionPreviewView/thread}
            .{Thread/displayName}
`;
