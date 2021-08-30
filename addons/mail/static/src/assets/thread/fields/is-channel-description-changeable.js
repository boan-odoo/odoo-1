/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Determines whether this description can be changed.
        Only makes sense for channels.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            isChannelDescriptionChangeable
        [Field/model]
            Thread
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/compute]
            @record
            .{Thread/model}
            .{=}
                mail.channel
            .{&}
                {Record/insert}
                    [Record/traits]
                        Collection
                    channel
                    group
                .{Collection/includes}
                    @record
                    .{Thread/channelType}
`;
