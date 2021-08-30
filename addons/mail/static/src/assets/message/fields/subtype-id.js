/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            subtypeId
        [Field/model]
            Message
        [Field/type]
            attr
`;
