/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            originThreadAttachments
        [Field/model]
            Thread
        [Field/type]
            many
        [Field/target]
            Attachment
        [Field/inverse]
            originThread
        [Field/isCausal]
            true
`;
