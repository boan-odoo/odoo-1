/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            counter
        [Element/model]
            ThreadPreviewComponent
        [web.Element/tag]
            span
        [Record/traits]
            NotificationListItemComponent/bold
            NotificationListItemComponent/counter
        [Element/isPresent]
            @record
            .{ThreadPreviewComponent/threadPreviewView}
            .{ThreadPreviewView/thread}
            .{Thread/localMessageUnreadCounter}
            .{>}
                0
        [web.Element/textContent]
            {String/sprintf}
                [0]
                    {Locale/text}
                        (%s)
                [1]
                    @record
                    .{ThreadPreviewComponent/threadPreviewView}
                    .{ThreadPreviewView/thread}
                    .{Thread/localMessageUnreadCounter}
`;
