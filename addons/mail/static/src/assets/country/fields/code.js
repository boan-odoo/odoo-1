/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            code
        [Field/model]
            Country
        [Field/type]
            attr
        [Field/target]
            String
`;
