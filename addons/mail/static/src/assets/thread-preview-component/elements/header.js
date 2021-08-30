/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            header
        [Element/model]
            ThreadPreviewComponent
        [Record/traits]
            NotificationListItemComponent/header
        [web.Element/class]
            align-items-baseline
`;
