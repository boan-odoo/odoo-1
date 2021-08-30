/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            nonImageAttachment
        [Element/model]
            AttachmentListComponent:nonImageAttachment
        [Field/target]
            AttachmentCardComponent
        [Record/traits]
            AttachmentListComponent/attachment
        [AttachmentCardComponent/attachmentCard]
            @record
            .{AttachmentListComponent:nonImageAttachment/attachmentCard}
`;
