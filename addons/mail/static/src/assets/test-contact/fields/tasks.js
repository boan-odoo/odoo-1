/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            tasks
        [Field/model]
            TestContact
        [Field/type]
            many
        [Field/target]
            TestTask
        [Field/inverse]
            TestTask/responsible
`;
