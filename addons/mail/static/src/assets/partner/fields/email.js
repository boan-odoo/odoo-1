/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            email
        [Field/model]
            Partner
        [Field/type]
            attr
        [Field/target]
            String
`;
