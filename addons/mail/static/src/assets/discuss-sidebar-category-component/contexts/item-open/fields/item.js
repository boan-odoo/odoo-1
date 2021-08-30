/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            item
        [Field/model]
            DiscussSidebarCategoryComponent:itemOpen
        [Field/type]
            one
        [Field/target]
            DiscussSidebarCategoryItem
        [Field/isRequired]
            true
`;
