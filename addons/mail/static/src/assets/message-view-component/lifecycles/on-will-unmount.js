/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onWillUnmount
        [Lifecycle/model]
            MessageViewComponent
        [Lifecycle/behavior]
            {web.Browser/clearInterval}
                @record
                .{MessageViewComponent/_intervalId}
`;
