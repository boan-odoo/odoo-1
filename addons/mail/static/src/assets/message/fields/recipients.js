/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            recipients
        [Field/model]
            Message
        [Field/type]
            many
        [Field/target]
            Partner
`;
