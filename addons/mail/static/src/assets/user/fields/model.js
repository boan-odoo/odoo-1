/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            model
        [Field/model]
            User
        [Field/type]
            attr
        [Field/target]
            String
        [Field/default]
            res.user
`;
