/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            MessageInReplyToViewComponent
        [Model/fields]
            messageInReplyToView
        [Model/template]
            root
                author
                body
                    bodyBackLinkText
                    attachmentBackLinkText
                    attachmentBackLinkIcon
                deleteMessage
`;
