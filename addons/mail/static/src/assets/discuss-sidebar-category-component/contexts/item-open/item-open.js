/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Context
        [Context/name]
            itemOpen
        [Context/model]
            DiscussSidebarCategoryComponent
        [Model/fields]
            item
        [Model/template]
            itemOpenForeach
                itemOpen
`;
