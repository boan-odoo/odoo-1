/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            optionsIcon
        [Element/model]
            RtcOptionListComponent
        [Record/traits]
            RtcOptionListComponent/icon
        [web.Element/class]
            fa-cog
`;
