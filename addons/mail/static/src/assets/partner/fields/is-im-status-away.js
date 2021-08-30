/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            isImStatusAway
        [Field/model]
            Partner
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/compute]
            @record
            .{Partner/imStatus}
            .{=}
                away
`;
