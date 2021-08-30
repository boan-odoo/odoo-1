/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            content
        [Element/model]
            NotificationRequestComponent
        [Record/traits]
            NotificationListItemComponent/content
`;
