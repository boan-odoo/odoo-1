/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            status
        [Field/model]
            Notification
        [Field/type]
            attr
        [Field/target]
            String
`;
