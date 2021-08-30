/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onWillUnmount
        [Lifecycle/model]
            DiscussComponent
        [Lifecycle/behavior]
            {if}
                @record
                .{DiscussComponent/discussView}
                .{DiscussView/discuss}
            .{then}
                {Discuss/close}
                    @record
                    .{DiscussComponent/discussView}
                    .{DiscussView/discuss}
`;
