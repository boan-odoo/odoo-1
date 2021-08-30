/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            currentGuest
        [Field/model]
            Env
        [Field/type]
            one
        [Field/target]
            Guest
`;
