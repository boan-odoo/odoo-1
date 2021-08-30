/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            imageAttachment
        [Element/model]
            AttachmentListComponent:imageAttachment
        [Field/target]
            AttachmentImageComponent
        [Record/traits]
            AttachmentListComponent/attachment
        [AttachmentImageComponent/attachmentImage]
            @record
            .{AttachmentListComponent:imageAttachment/attachmentImage}
`;
