/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Handles click on the reaction icon.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessageActionList/onClickActionReaction
        [Action/params]
            ev
                [type]
                    MouseEvent
            record
                [type]
                    MessageActionList
        [Action/behavior]
            {if}
                @record
                .{MessageActionList/reactionPopoverView}
                .{isFalsy}
            .{then}
                {Record/update}
                    [0]
                        @record
                    [1]
                        [MessageActionList/reactionPopoverView]
                            {Record/insert}
                                [Record/traits]
                                    PopoverView
            .{else}
                {Record/update}
                    [0]
                        @record
                    [1]
                        [MessageActionList/reactionPopoverView]
                            {Record/empty}
`;
