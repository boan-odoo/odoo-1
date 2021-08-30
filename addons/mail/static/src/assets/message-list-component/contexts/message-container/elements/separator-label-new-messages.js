/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            separatorLabelNewMessages
        [Element/model]
            MessageListComponent:messageContainer
        [web.Element/tag]
            span
        [Record/traits]
            MessageListComponent/separatorLabel
        [web.Element/textContent]
            {Locale/text}
                New messages
`;
