/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            id
        [Field/model]
            UserSetting
        [Field/type]
            attr
        [Field/target]
            Integer
        [Field/isReadonly]
            true
        [Field/isRequired]
            true
`;
