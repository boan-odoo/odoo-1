/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            _subtypesListDialog
        [Field/model]
            Follower
        [Field/type]
            one
        [Field/target]
            FollowerSubtypeList
`;
