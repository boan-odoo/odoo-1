/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            actionReaction
        [Field/model]
            MessageActionListComponent
        [Record/traits]
            MessageActionListComponent/action
        [web.Element/tag]
            i
        [Element/isPresent]
            @record
            .{MessageActionListComponent/messageActionList}
            .{MessageActionList/message}
            .{Message/hasReactionIcon}
        [web.Element/class]
            fa-smile-o
        [web.Element/title]
            {Locale/text}
                Add a Reaction
        [Element/onClick]
            {MessageActionList/onClickReaction}
                [0]
                    @record
                    .{MessageActionListComponent/messageActionList}
                [1]
                    @ev
        [PopoverComponent/onClosed]
            {MessageActionList/onReactionPopoverClosed}
                [0]
                    @record
                    .{MessageActionListComponent/messageActionList}
                [1]
                    @ev
        [PopoverComponent/onOpened]
            {MessageActionList/onReactionPopoverOpened}
                [0]
                    @record
                    .{MessageActionListComponent/messageActionList}
                [1]
                    @ev
        [web.Element/style]
            [web.scss/display]
                inline
                {Dev/comment}
                    override block from popover div
`;
