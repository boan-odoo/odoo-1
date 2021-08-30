/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            itemOpen
        [Element/model]
            DiscussSidebarCategoryComponent:itemOpen
        [Record/traits]
            DiscussSidebarCategoryComponent/item
        [Field/target]
            DiscussSidebarCategoryItemComponent
        [DiscussSidebarCategoryItemComponent/categoryItem]
            @record
            .{DiscussSidebarCategoryComponent:itemOpen/item}
`;
