/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            dateDeadline
        [Field/model]
            Activity
        [Field/type]
            attr
        [Field/target]
            Date
`;
