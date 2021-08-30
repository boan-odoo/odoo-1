/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            threadViews
        [Field/model]
            Thread
        [Field/type]
            many
        [Field/target]
            ThreadView
        [Field/inverse]
            ThreadView/thread
`;
