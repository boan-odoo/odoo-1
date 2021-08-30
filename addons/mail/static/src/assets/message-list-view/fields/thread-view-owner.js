/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            threadViewOwner
        [Field/model]
            MessageListView
        [Field/type]
            one
        [Field/target]
            ThreadView
        [Field/inverse]
            ThreadView/messageListView
        [Field/isReadonly]
            true
        [Field/isRequired]
            true
`;
