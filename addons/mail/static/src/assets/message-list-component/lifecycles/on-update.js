/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onUpdate
        [Lifecycle/model]
            MessageListComponent
        [Lifecycle/behavior]
            {MessageListComponent/adjustFromComponentHints}
                @record
`;
