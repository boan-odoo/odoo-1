/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            name
        [Field/model]
            Guest
        [Field/type]
            attr
        [Field/target]
            String
`;
