/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            categoryLivechat
        [Element/feature]
            im_livechat
        [Element/model]
            DiscussSidebarComponent
        [Element/isPresent]
            {Discuss/categoryLivechat}
            .{DiscussSidebarCategory/categoryItems}
            .{Collection/length}
            .{>}
                0
        [Record/traits]
            DiscussSidebarComponent/category
        [Field/target]
            DiscussSidebarCategoryComponent
        [DiscussSidebarCategoryComponent/category]
            {Discuss/categoryLivechat}
`;
