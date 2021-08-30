/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            activityViews
        [Field/model]
            ActivityBoxView
        [Field/type]
            many
        [Field/target]
            ActivityView
        [Fild/isCausal]
            true
        [Field/inverse]
            ActivityView/activityBoxView
        [Field/compute]
            @record
            .{ActivityBoxView/chatter}
            .{Chatter/thread}
            .{Thread/activities}
            .{Collection/map}
                {Record/insert}
                    [Record/traits]
                        Function
                    [Function/in]
                        activity
                    [Function/out]
                        {Record/insert}
                            [Record/traits]
                                ActivityView
                            [ActivityView/activity]
                                @activity
`;
