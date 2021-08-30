/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            discussAsChat
        [Field/model]
            DiscussSidebarCategory
        [Field/type]
            one
        [Field/target]
            Discuss
        [Field/isReadonly]
            true
        [Field/inverse]
            Discuss/categoryChat
`;
