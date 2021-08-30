/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            moduleIcon
        [Field/model]
            Thread
        [Field/type]
            attr
        [Field/target]
            String
`;
