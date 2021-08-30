/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            startMeetingButtonContainer
        [Element/model]
            DiscussSidebarComponent
        [web.Element/class]
            d-flex
            justify-content-center
`;
