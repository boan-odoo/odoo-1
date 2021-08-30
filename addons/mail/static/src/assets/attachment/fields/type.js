/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            type
        [Field/model]
            Attachment
        [Field/type]
            attr
`;
