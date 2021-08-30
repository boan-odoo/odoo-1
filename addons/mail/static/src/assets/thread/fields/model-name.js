/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            modelName
        [Field/model]
            Thread
        [Field/type]
            attr
        [Field/target]
            String
`;
