/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            members
        [Field/model]
            Thread
        [Field/type]
            many
        [Field/target]
            Partner
        [Field/inverse]
            Partner/memberThreads
`;
