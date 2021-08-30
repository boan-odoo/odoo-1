/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            moreButtonPopover
        [Element/model]
            RtcControllerComponent
        [Record/traits]
            PopoverComponent
        [PopoverComponent/position]
            top
`;
