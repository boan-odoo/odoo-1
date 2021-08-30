/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            checksum
        [Field/model]
            Attachment
        [Field/type]
            attr
`;
