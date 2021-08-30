/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            actionEdit
        [Field/model]
            MessageActionListComponent
        [Record/traits]
            MessageActionListComponent/action
        [Element/isPresent]
            @record
            .{MessageActionListComponent/messageActionList}
            .{MessageActionList/message}
            .{Message/canBeDeleted}
        [web.Element/class]
            fa-pencil
        [web.Element/title]
            {Locale/text}
                Edit
        [Element/onClick]
            {MessageActionList/onClickEdit}
                @record
                .{MessageActionListComponent/messageActionLists}
`;
