/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Snapshot computed during willPatch, which is used by patched.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            _willPatchSnapshot
        [Field/model]
            MessageListComponent
        [Field/type]
            attr
        [Field/target]
            Object
`;
