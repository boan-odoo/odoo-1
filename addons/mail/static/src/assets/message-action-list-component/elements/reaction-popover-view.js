/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            reactionPopoverView
        [Field/model]
            MessageActionListComponent
        [Record/traits]
            PopoverViewComponent
        [PopoverViewComponent/popoverView]
            @record
            .{MessageActionListComponent/messageActionList}
            .{MessageActionList/reactionPopoverView}
        [Element/isPresent]
            @record
            .{MessageActionListComponent/messageActionList}
            .{MessageActionList/reactionPopoverView}
`;
