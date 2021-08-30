/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            threadModel
        [Field/model]
            ChatterContainerComponent
        [Field/type]
            attr
        [Field/target]
            String
        [Field/isRequired]
            true
`;
