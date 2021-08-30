/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            title
        [Field/model]
            ThreadTypingIconComponent
        [Field/type]
            attr
        [Field/target]
            String
`;
