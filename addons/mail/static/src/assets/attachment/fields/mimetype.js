/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            mimetype
        [Field/model]
            Attachment
        [Field/type]
            attr
        [Field/target]
            String
`;
