/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            FieldAddon
        [FieldAddon/field]
            Partner/isImStatusOnline
        [FieldAddon/feature]
            hr_holidays
        [FieldAddon/compute]
            @original
            .{|}
                @record
                .{Partner/imStatus}
                .{=}
                    leave_online
`;
