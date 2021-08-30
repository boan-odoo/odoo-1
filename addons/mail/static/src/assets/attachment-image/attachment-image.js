/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            AttachmentImage
        [Model/fields]
            attachment
            attachmentDeleteConfirmDialog
            attachmentList
            component
            height
            imageUrl
            width
        [Model/id]
            AttachmentImage/attachmentList
            .{&}
                AttachmentImage/attachment
        [Model/actions]
            AttachmentImage/onClickImage
            AttachmentImage/onClickUnlink
`;
