/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            attachmentBoxView
        [Field/model]
            Chatter
        [Field/type]
            one
        [Field/target]
            AttachmentBoxView
        [Field/isCausal]
            true
        [Field/inverse]
            AttachmentBoxView/chatter
`;
