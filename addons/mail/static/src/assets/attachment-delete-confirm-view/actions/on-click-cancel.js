/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            AttachmentDeleteConfirmView/onClickCancel
        [Action/params]
            record
                [type]
                    AttachmentDeleteConfirmView
        [Action/behavior]
            {Record/delete}
                @record
                .{AttachmentDeleteConfirmView/dialogOwner}
`;
