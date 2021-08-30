/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            record
        [Field/model]
            FollowerSubtypeListComponent
        [Field/type]
            one
        [Field/target]
            FollowerSubtypeList
        [Field/isRequired]
            true
        [Field/inverse]
            FollowerSubtypeList/followerSubtypeListComponents
`;
