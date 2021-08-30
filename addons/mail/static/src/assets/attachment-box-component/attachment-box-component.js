/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            AttachmentBoxComponent
        [Model/fields]
            attachmentBoxView
            dropzoneVisible
        [Model/template]
            root
                title
                    dashedLineStart
                    titleText
                    dashedLineEnd
                content
                    dropZone
                    attachmentList
                    buttonAdd
                        buttonAddIcon
                        buttonAddLabel
`;
