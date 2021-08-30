/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            headerDate
        [Element/model]
            MessageViewComponent
        [Record/traits]
            MessageViewComponent/date
        [Element/isPresent]
            @record
            .{MessageViewComponent/messageView}
            .{MessageView/message}
            .{Message/date}
        [web.Element/title]
            @record
            .{MessageViewComponent/messageView}
            .{MessageView/message}
            .{Message/date}
            .{Moment/format}
                {Locale/getLangDatetimeFormat}
        [web.Element/textContent]
            - 
            .{+}
                @record
                .{MessageViewComponent/messageView}
                .{MessageView/message}
                .{Message/dateFromNow}
        [web.Element/style]
            [web.scss/margin-inline-end]
                {scss/map-get}
                    {scss/$spacers}
                    2
            [web.scss/font-size]
                0.8em
`;
