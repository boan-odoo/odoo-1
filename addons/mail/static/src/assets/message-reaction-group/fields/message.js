/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            message
        [Field/model]
            MessageReactionGroup
        [Field/type]
            one
        [Field/target]
            Message
        [Field/isRequired]
            true
        [Field/isReadonly]
            true
        [Field/inverse]
            Message/messageReactionGroups
        [Field/compute]
            {Record/insert}
                [Record/traits]
                    Message
                [Message/id]
                    @record
                    .{MessageReactionGroup/messageId}
`;
