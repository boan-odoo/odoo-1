/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onUpdate
        [Lifecycle/model]
            DiscussComponent
        [Lifecycle/behavior]
            {Discuss/open}
            {if}
                {Discuss/thread}
            .{then}
                {Component/trigger}
                    @record
                    o-push-state-action-manager
            .{elif}
                {Messaging/isInitialized}
            .{then}
                {Discuss/openInitThread}
            {DiscussComponent/_updateLocalStoreProps}
                @record
`;
