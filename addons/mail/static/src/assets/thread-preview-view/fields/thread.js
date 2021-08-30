/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            thread
        [Field/model]
            ThreadPreviewView
        [Field/type]
            one
        [Field/target]
            Thread
        [Field/isReadonly]
            true
        [Field/isRequired]
            true
        [Field/inverse]
            Thread/threadPreviewViews
`;
