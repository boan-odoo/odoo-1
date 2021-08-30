/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            hasMessageList
        [Field/model]
            ChatterContainerComponent
        [Field/type]
            attr
        [Field/target]
            Boolean
`;
