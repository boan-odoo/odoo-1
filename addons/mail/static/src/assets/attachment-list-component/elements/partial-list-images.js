/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            partialListImages
        [Element/model]
            AttachmentListComponent
        [Record/traits]
            AttachmentListComponent/partialList
`;
