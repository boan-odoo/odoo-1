/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            isExpandable
        [Field/model]
            ChatWindowComponent
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/default]
            false
`;
