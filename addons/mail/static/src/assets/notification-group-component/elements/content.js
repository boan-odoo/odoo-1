/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            content
        [Element/model]
            NotificationGroupComponent
        [Record/traits]
            NotificationListItemComponent/content
`;
