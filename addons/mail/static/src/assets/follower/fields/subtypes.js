/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            subtypes
        [Field/model]
            Follower
        [Field/type]
            many
        [Field/target]
            FollowerSubtype
`;
