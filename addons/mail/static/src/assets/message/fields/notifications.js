/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            notifications
        [Field/model]
            Message
        [Field/type]
            many
        [Field/target]
            Notification
        [Field/inverse]
            message
        [Field/isCausal]
            true
`;
