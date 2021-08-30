/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Determines whether it makes sense for this thread to have a member list.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            hasMemberListFeature
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
