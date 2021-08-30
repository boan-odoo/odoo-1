/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            memberThreads
        [Field/model]
            Partner
        [Field/type]
            many
        [Field/target]
            Thread
        [Field/inverse]
            Thread/members
`;
