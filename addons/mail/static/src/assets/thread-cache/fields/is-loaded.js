/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            isLoaded
        [Field/model]
            ThreadCache
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/default]
            false
`;
