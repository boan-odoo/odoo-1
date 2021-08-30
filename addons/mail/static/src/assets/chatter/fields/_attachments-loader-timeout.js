/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            _attachmentsLoaderTimeout
        [Field/model]
            Chatter
        [Field/type]
            attr
        [Field/target]
            Number
        [Field/default]
            0
`;
