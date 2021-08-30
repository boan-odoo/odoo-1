/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            notificationNonFailureIcon
        [Element/model]
            MessageViewComponent
        [Record/traits]
            MessageViewComponent/notificationIcon
        [web.Element/name]
            notificationIcon
        [web.Element/tag]
            i
        [web.Element/class]
            fa
            fa-envelope-o
`;
