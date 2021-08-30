/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            fetchMessagesParams
        [Field/model]
            Thread
        [Field/type]
            attr
        [Field/target]
            Object
        [Field/compute]
            {if}
                @record
                .{Thread/model}
                .{=}
                    mail.box
            .{then}
                {Record/insert}
                    [Record/traits]
                        Object
            .{elif}
                @record
                .{Thread/model}
                .{=}
                    mail.channel
            .{then}
                {Record/insert}
                    [Record/traits]
                        Object
                    [channel_id]
                        @record
                        .{Thread/id}
            .{else}
                {Record/insert}
                    [Record/traits]
                        Object
                    [thread_id]
                        @record
                        .{Thread/id}
                    [thread_model]
                        @record
                        .{Thread/model}
`;
