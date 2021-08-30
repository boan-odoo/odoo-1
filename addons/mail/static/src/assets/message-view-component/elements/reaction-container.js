/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            reactionContainer
        [Element/model]
            MessageViewComponent
        [web.Element/class]
            d-flex
            flex-wrap
            ml-2
`;
