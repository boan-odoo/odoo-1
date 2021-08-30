/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Boolean determines whether ThreadIcon will be displayed in UI.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            hasThreadIcon
        [Field/model]
            DiscussSidebarCategoryItem
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/compute]
            {switch}
                @record
                .{DiscussSidebarCategoryItem/channelType}
            .{case}
                [channel]
                    @record
                    .{DiscussSidebarCategoryItem/channel}
                    .{Thread/public}
                    .{=}
                        private
                [chat]
                    true
                [group]
                    false
`;
