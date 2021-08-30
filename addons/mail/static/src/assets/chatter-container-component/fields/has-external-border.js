/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            hasExternalBorder
        [Field/model]
            ChatterContainerComponent
        [Field/type]
            attr
        [Field/target]
            Boolean
`;
