/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            id
        [Field/model]
            Activity
        [Field/type]
            attr
        [Field/target]
            Number
        [Field/isRequired]
            true
        [Field/isReadonly]
            true
`;
