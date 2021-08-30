/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            canWrite
        [Field/model]
            Activity
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/default]
            false
`;
