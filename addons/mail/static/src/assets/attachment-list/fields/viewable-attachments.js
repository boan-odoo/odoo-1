/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        States the attachments that can be viewed inside the browser.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            viewableAttachments
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
                        .{Attachment/isViewable}
`;
