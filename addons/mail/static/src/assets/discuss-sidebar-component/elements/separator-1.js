/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            separator1
        [Element/model]
            DiscussSidebarComponent
        [Record/traits]
            DiscussSidebarComponent/separator
`;
