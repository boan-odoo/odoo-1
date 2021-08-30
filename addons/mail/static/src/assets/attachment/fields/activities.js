/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            activities
        [Field/model]
            Attachment
        [Field/type]
            many
        [Field/target]
            Activity
        [Field/inverse]
            Activity/attachments
`;
