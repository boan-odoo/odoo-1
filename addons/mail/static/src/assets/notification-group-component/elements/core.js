/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            core
        [Element/model]
            NotificationGroupComponent
        [Record/traits]
            NotificationListItemComponent/core
`;
