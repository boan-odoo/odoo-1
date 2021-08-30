/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            hasTopbarCloseButton
        [Field/model]
            Chatter
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/default]
            false
`;
