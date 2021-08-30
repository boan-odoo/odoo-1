/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            icon
        [Element/model]
            MessagingMenuComponent
        [web.Element/tag]
            i
        [web.Element/class]
            oi
            oi-large
            oi-discuss
        [web.Element/role]
            img
        [web.Element/aria-label]
            {Locale/text}
                Messages
`;
