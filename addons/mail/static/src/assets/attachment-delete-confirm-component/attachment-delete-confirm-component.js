/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            AttachmentDeleteConfirmComponent
        [Model/fields]
            attachmentDeleteConfirmView
        [Model/template]
            root
                title
                separator
                mainText
                separator
                buttons
                    confirmButton
                    cancelButton
`;
