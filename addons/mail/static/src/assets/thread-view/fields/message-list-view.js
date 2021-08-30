/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            messageListView
        [Field/model]
            ThreadView
        [Field/type]
            one
        [Field/target]
            MessageListView
        [Field/isCausal]
            true
        [Field/inverse]
            MessageListView/threadViewOwner
        [Field/compute]
            {if}
                @record
                .{ThreadView/thread}
                .{&}
                    @record
                    .{ThreadView/thread}
                    .{Thread/isTemporary}
                .{|}
                    @record
                    .{ThreadView/threadCache}
                    .{&}
                        @record
                        .{ThreadView/threadCache}
                        .{ThreadCache/isLoaded}
            .{then}
                {Record/insert}
                    [Record/traits]
                        MessageListView
            .{else}
                {Record/empty}
`;
