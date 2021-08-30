/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            chatter
        [Field/model]
            ActivityBoxView
        [Field/type]
            one
        [Field/target]
            Chatter
        [Fild/isReadonly]
            true
        [Field/isRequired]
            true
        [Field/inverse]
            Chatter/activityBoxView
`;
