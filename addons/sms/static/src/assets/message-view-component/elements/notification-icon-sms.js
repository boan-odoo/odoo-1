/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            notificationIconSms
        [Element/feature]
            sms
        [Element/model]
            MessageViewComponent
        [web.Element/tag]
            i
        [Record/traits]
            MessageViewComponent/notificationIcon
        [web.Element/class]
            fa
            fa-mobile
        [Element/isPresent]
            @record
            .{MessageViewComponent/messageView}
            .{MessageView/message}
            .{Message/type}
            .{=}
                sms
`;
