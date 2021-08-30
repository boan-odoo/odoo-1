/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            PopoverViewComponent
        [Model/fields]
            popoverView
        [Model/template]
            root
                content
        [Model/lifecycle]
            onCreate
`;
