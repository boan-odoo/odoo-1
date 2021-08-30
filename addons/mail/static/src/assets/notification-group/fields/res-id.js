/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            resId
        [Field/model]
            NotificationGroup
        [Field/type]
            attr
        [Field/target]
            String
        [Field/isReadonly]
            true
`;
