/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            attachmentCard
        [Field/model]
            AttachmentListComponent:nonImageAttachment
        [Field/type]
            one
        [Field/target]
            AttachmentCard
        [Field/isRequired]
            true
`;
