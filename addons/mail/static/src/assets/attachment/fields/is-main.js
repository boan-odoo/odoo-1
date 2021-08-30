/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            isMain
        [Field/model]
            Attachment
        [Field/type]
            attr
        [Field/target]
            Boolean
`;
