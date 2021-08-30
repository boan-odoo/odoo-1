/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            hasComposerThreadName
        [Field/model]
            ThreadViewComponent
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/default]
            false
`;
