/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            followedThread
        [Field/model]
            Follower]
        [Field/type]
            one
        [Field/target]
            Thread
        [Field/inverse]
            Thread/followers
`;
