/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessagingNotificationHandler/_handleNotificationAttachmentDelete
        [Action/params]
            record
                [type]
                    MessagingNotificationHandler
            payload
                [type]
                    Object
                [description]
                    @param {integer} [payload.id]
        [Action/behavior]
            :attachment
                {Attachment/findById}
                    @payload
            {if}
                @attachment
            .{then}
                {Record/delete}
                    @attachment
`;
