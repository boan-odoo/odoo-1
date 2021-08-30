/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            notificationFailureIcon
        [Element/model]
            MessageViewComponent
        [web.Element/tag]
            i
        [Record/traits]
            MessageViewComponent/notificationIcon
        [web.Element/class]
            fa
            fa-envelope
`;
