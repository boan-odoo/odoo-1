/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            sequence
        [Field/model]
            FollowerSubtype
        [Field/type]
            attr
        [Field/target]
            Number
`;
