/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            message
        [Field/model]
            AttachmentList
        [Field/type]
            one
        [Field/target]
            Message
        [Field/related]
            AttachmentList/messageViewOwner
            MessageView/message
`;
