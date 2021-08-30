/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            public
        [Field/model]
            Thread
        [Field/type]
            attr
`;
