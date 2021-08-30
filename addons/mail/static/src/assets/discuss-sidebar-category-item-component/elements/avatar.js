/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            avatar
        [Element/model]
            DiscussSidebarCategoryItemComponent
        [Record/traits]
            DiscussSidebarCategoryItemComponent/item
`;
