/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            inlineText
        [Element/model]
            NotificationListItemComponent
        [web.Element/class]
            text-truncate
`;
