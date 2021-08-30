/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            threads
        [Field/model]
            Attachment
        [Field/type]
            many
        [Field/target]
            Thread
        [Field/inverse]
            Thread/attachments
`;
