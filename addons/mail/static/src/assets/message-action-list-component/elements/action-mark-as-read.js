/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            actionMarkAsRead
        [Field/model]
            MessageActionListComponent
        [Record/traits]
            MessageActionListComponent/action
        [Element/isPresent]
            @record
            .{MessageActionListComponent/messageActionList}
            .{MessageActionList/hasMarkAsReadIcon}
        [web.Element/class]
            fa-check
        [web.Element/title]
            {Locale/text}
                Mark as Read
        [Element/onClick]
            {MessageActionList/onClickMarkAsRead}
                @record
                .{MessageActionListComponent/messageActionList}
`;
