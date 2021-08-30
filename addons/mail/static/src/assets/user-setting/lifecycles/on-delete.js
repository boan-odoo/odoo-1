/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onDelete
        [Lifecycle/model]
            UserSetting
        [Lifecycle/behavior]
            {foreach}
                @record
                .{UserSetting/_timeoutIds}
            .{as}
                timeoutId
            .{do}
                {Browser/clearTimeout}
                    @timeoutId
`;
