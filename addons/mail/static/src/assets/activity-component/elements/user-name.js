/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            userName
        [Element/model]
            ActivityComponent
        [Element/isPresent]
            @record
            .{ActivityComponent/activityView}
            .{ActivityView/activity}
            .{Activity/assignee}
        [web.Element/textContent]
            @record
            .{ActivityComponent/activityView}
            .{ActivityView/assignedUserText}
`;
