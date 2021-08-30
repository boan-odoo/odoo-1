/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            attachmentViewer
        [Field/model]
            Dialog
        [Field/type]
            one
        [Field/target]
            AttachmentViewer
        [Field/isCausal]
            true
        [Field/inverse]
            AttachmentViewer/dialogOwner
        [Field/compute]
            {if}
                @record
                .{Dialog/attachmentListOwnerAsAttachmentView}
            .{then}
                {Record/insert}
                    [Record/traits]
                        AttachmentViewer
            .{else}
                {Record/empty}
`;
