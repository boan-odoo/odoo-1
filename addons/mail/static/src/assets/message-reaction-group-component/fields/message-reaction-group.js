/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            messageReactionGroup
        [Field/model]
            MessageReactionGroupComponent
        [Field/type]
            one
        [Field/target]
            MessageReactionGroup
`;
