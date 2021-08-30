/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            inlineText
        [Element/model]
            NotificationRequestComponent
        [web.Element/tag]
            span
        [Record/traits]
            NotificationListItemComponent/coreItem
            NotificationListItemComponent/inlineText
        [web.Element/textContent]
            {Locale/text}
                Enable desktop notifications to chat.
`;
