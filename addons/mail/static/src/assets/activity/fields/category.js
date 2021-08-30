/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            category
        [Field/model]
            Activity
        [Field/type]
            attr
`;
