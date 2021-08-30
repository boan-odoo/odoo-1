/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            attachmentDeleteConfirmDialog
        [Field/model]
            AttachmentImage
        [Field/type]
            one
        [Field/target]
            Dialog
        [Field/isCausal]
            true
        [Field/inverse]
            Dialog/attachmentImageOwnerAsAttachmentDeleteConfirm
`;
