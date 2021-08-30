/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            scrollHeight
        [Field/model]
            MessageListView
        [Field/type]
            attr
        [Field/target]
            Integer
`;
