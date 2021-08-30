/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            attachments
        [Field/model]
            Thread
        [Field/type]
            many
        [Field/target]
            Attachment
        [Field/inverse]
            Attachment/threads
`;
