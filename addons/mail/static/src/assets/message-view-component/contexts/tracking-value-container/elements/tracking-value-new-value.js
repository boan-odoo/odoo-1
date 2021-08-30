/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            trackingValueNewValue
        [Element/model]
            MessageViewComponent:trackingValueContainer
        [Record/traits]
            MessageViewComponent/trackingValueItem
        [Element/isPresent]
            @record
            .{MessageViewComponent:trackingValueContainer/value}
            .{TrackingValue/new_value}
        [web.Element/textContent]
            @record
            .{MessageViewComponent:trackingValueContainer/value}
            .{TrackingValue/new_value}
`;
