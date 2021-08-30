/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            name
        [Field/model]
            ChatWindow
        [Field/type]
            attr
        [Field/target]
            String
        [Field/compute]
            {if}
                @record
                .{ChatWindow/thread}
            .{then}
                @record
                .{ChatWindow/thread}
                .{Thread/displayName}
            .{else}
                {Locale/text}
                    New message
`;
