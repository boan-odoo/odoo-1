/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            autogrow
        [Element/model]
            DiscussSidebarCategoryComponent
        [Record/traits]
            AutogrowComponent
            DiscussSidebarCategoryComponent/headerItem
`;
