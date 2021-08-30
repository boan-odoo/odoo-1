/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            creator
        [Field/model]
            Thread
        [Field/type]
            one
        [Field/target]
            User
`;
