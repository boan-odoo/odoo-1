/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            buttonScheduleActivity
        [Element/model]
            ChatterTopbarComponent
        [web.Element/tag]
            button
        [web.Element/type]
            button
        [Record/traits]
            ChatterTopbarComponent/button
        [web.Element/class]
            btn
            btn-link
        [Element/isPresent]
            @record
            .{ChatterTopbarComponent/chatter}
            .{Chatter/hasActivities}
        [web.Element/isDisabled]
            @record
            .{ChatterTopbarComponent/chatter}
            .{Chatter/isDisabled}
        [Element/onClick]
            {Chatter/onClickScheduleActivity}
                @record
                .{ChatterTopbarComponent/chatter}
`;
