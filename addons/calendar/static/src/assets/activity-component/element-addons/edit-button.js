/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ElementAddon
        [ElementAddon/feature]
            calendar
        [ElementAddon/field]
            ActivityComponent/editButton
        [ElementAddon/model]
            ActivityComponent
        [ElementAddon/isPresent]
            @record
            .{ActivityComponent/activityView}
            .{ActivityView/activity}
            .{Activity/calendarEventId}
            .{isFalsy}
`;
