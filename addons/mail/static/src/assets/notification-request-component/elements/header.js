/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            header
        [Element/model]
            NotificationRequestComponent
        [Record/traits]
            NotificationListItemComponent/header
`;
