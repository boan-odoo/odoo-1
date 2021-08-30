/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            sidebarText
        [Element/model]
            RtcLayoutMenuComponent
        [Record/traits]
            RtcLayoutMenuComponent/text
        [web.Element/textContent]
            {Locale/text}
                Sidebar
`;
