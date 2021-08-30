/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            bodyBackLinkText
        [Element/model]
            MessageInReplyToViewComponent
        [Element/isPresent]
            @record
            .{MessageInReplyToViewComponent/messageInReplyToView}
            .{MessageInReplyToView/hasBodyBackLink}
        [web.Element/htmlContent]
            @record
            .{MessageInReplyToViewComponent/messageInReplyToView}
            .{MessageInReplyToView/messageView}
            .{MessageView/message}
            .{Message/parentMessage}
            .{Message/contentAsMarkup}
`;
