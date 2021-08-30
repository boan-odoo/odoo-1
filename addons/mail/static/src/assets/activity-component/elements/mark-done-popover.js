/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            markDonePopover
        [Element/model]
            ActivityComponent
        [Field/target]
            PopoverComponent
        [PopoverComponent/position]
            right
        [PopoverComponent/title]
            @record
            .{ActivityComponent/activityView}
            .{ActivityView/markDoneText}
        [PopoverComponent/content]
            {Record/insert}
                [Record/traits]
                    ActivityMarkDonePopoverComponent
                [ActivityMarkDonePopoverComponent/activityMarkDonePopoverView]
                    @record
                    .{ActivityComponent/activityView}
                    .{ActivityView/activityMarkDonePopoverView}
`;
