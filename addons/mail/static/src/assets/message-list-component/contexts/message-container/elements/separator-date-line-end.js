/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            separatorDateLineEnd
        [Element/model]
            MessageListComponent:messageContainer
        [web.Element/tag]
            hr
        [Record/traits]
            MessageListComponent/separatorLine
`;
