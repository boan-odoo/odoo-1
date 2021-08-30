/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            popoverView
        [Field/model]
            PopoverViewComponent
        [Field/type]
            one
        [Field/target]
            PopoverView
        [Field/inverse]
            PopoverView/component
`;
