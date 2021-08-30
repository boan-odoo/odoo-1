/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            threadView
        [Field/model]
            ThreadViewComponent
        [Field/type]
            one
        [Field/target]
            Thread
        [Field/isRequired]
            true
`;
