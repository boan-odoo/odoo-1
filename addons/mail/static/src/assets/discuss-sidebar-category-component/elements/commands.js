/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            commands
        [Element/model]
            DiscussSidebarCategoryComponent
        [Record/traits]
            DiscussSidebarCategoryComponent/headerItem
        [web.Element/style]
            [web.scss/display]
                flex
`;
