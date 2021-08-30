/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            trackingValueNewValueUnset
        [Element/model]
            MessageViewComponent:trackingValueContainer
        [Record/traits]
            MessageViewComponent/trackingValueItem
        [web.Element/tag]
            i
        [Element/isPresent]
            @record
            .{MessageViewComponent:trackingValueContainer/value}
            .{TrackingValue/new_value}
            .{isFalsy}
        [web.Element/textContent]
            {Locale/text}
                None
`;
