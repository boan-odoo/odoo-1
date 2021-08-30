/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            columnCount
        [Field/model]
            RtcCallViewerComponent
        [Field/type]
            attr
        [Field/target]
            Integer
        [Field/default]
            0
`;
