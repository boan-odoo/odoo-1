/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            partner
        [Field/model]
            Notification
        [Field/type]
            one
        [Field/target]
            Partner
`;
