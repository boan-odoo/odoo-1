/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            displayName
        [Field/model]
            Thread
        [Field/type]
            attr
        [Field/target]
            String
        [Field/compute]
            {if}
                @record
                .{Thread/channelType}
                .{=}
                    chat
                .{&}
                    @record
                    .{Thread/correspondent}
            .{then}
                @record
                .{Thread/customChannelName}
                .{|}
                    @record
                    .{Thread/correspondent}
                    .{Partner/nameOrDisplayName}
            .{elif}
                @record
                .{Thread/channelType}
                .{=}
                    group
            .{then}
                @record
                .{Thread/name}
                .{|}
                    @record
                    .{Thread/members}
                    .{Collection/map}
                        {Record/insert}
                            [Record/traits]
                                Function
                            [Function/in]
                                item
                            [Function/out]
                                @item
                                .{Partner/nameOrDisplayName}
                    .{String/join}
                        , 
            .{else}
                @record
                .{Thread/name}
`;
