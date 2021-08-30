/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            lastSeenMessage
        [Field/model]
            ThreadPartnerSeenInfo
        [Field/type]
            one
        [Field/target]
            Message
`;
