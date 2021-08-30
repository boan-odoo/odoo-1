/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            isActive
        [Field/model]
            Follower
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/default]
            true
`;
