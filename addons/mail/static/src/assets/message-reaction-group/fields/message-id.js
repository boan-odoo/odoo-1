/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            messageId
        [Field/model]
            MessageReactionGroup
        [Field/type]
            attr
        [Field/target]
            Integer
        [Field/isRequired]
            true
        [Field/isReadonly]
            true
`;
