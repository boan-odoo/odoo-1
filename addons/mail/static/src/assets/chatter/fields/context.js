/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            context
        [Field/model]
            Chatter
        [Field/type]
            attr
        [Field/target]
            Object
`;
