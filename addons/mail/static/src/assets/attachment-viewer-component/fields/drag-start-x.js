/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            dragstartX
        [Field/model]
            AttachmentViewerComponent
        [Field/type]
            attr
        [Field/target]
            Number
        [Field/default]
            0
`;