/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            name
        [Field/model]
            Thread
        [Field/type]
            attr
        [Field/target]
            String
`;
