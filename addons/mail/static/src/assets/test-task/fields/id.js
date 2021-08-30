/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            id
        [Field/model]
            TestTask
        [Field/type]
            attr
        [Field/isRequired]
            true
        [Field/isReadonly]
            true
`;
