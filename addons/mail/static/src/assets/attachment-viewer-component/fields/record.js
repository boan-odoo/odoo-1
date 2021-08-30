/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            record
        [Field/model]
            AttachmentViewerComponent
        [Field/type]
            one
        [Field/target]
            AttachmentViewer
        [Field/isRequired]
            true
`;
