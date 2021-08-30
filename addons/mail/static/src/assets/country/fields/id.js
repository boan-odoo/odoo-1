/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            id
        [Field/model]
            Country
        [Field/type]
            attr
        [Field/target]
            Number
        [Field/isReadonly]
            true
        [Field/isRequired]
            true
`;
