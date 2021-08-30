/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Determines whether the last message fetch failed.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            hasLoadingFailed
        [Field/model]
            ThreadCache
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/default]
            false
`;
