/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            isUploading
        [Field/model]
            Attachment
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/default]
            false
`;
