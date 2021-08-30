/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Boolean determines whether the item has a "settings" command.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            hasSettingsCommand
        [Field/model]
            DiscussSidebarCategoryItem
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/compute]
            @record
            .{DiscussSidebarCategoryItem/channelType}
            .{=}
                channel
`;
