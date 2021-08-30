/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            partialListNonImages
        [Element/model]
            AttachmentListComponent
        [Record/traits]
            AttachmentListComponent/partialList
        [web.Element/class]
            justify-content-start
            m-1
`;
