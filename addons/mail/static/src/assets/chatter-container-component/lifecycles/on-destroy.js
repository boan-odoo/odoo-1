/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onDestroy
        [Lifecycle/model]
            ChatterContainerComponent
        [Lifecycle/behavior]
            {if}
                @record
                .{ChatterContainerComponent/chatter}
                .{isFalsy}
            .{then}
                {break}
            {Record/delete}
                @record
                .{ChatterContainerComponent/chatter}
`;
