/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            trackingValueFieldName
        [Element/model]
            MessageViewComponent:trackingValueContainer
        [Record/traits]
            MessageViewComponent/trackingValueItem
        [web.Element/textContent]
            @record
            .{MessageViewComponent:trackingValueContainer/value}
            .{TrackingValue/changed_field}
`;
