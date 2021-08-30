/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            dueDateTextIn
        [Element/model]
            ActivityComponent
        [web.Element/tag]
            b
        [web.Element/textContent]
            @record
            .{ActivityComponent/activityView}
            {ActivityView/delayLabel}
`;
