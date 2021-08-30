/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            lastMessageView
        [Field/model]
            ThreadView
        [Field/type]
            one
        [Field/target]
            MessageView
        [Field/compute]
            :lastMessageView
                @record
                .{ThreadView/messageViews}
                .{Collection/last}
            {if}
                @lastMessageView
            .{then}
                @lastMessageView
            .{else}
                {Record/empty}
`;
