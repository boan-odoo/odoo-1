/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            thread
        [Field/model]
            ThreadTextualTypingStatusComponent
        [Field/type]
            one
        [Field/target]
            Thread
        [Field/isRequired]
            true
`;
