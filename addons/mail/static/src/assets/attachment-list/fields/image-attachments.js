/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        States the attachment that are an image.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            imageAttachments
        [Field/model]
            AttachmentList
        [Field/type]
            many
        [Field/target]
            Attachment
        [Field/compute]
            @record
            .{AttachmentList/attachments}
            .{Collection/filter}
                {Record/insert}
                    [Record/traits]
                        Function
                    [Function/in]
                        item
                    [Function/out]
                        @item
                        .{Attachment/isImage}
`;
