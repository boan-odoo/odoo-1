/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            AttachmentBoxView
        [Model/fields]
            attachmentList
            chatter
            component
            fileUploader
        [Model/id]
            AttachmentBoxView/chatter
        [Model/actions]
            AttachmentBoxView/onClickAddAttachment
`;
