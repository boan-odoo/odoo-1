/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            seenIndicator
        [Element/model]
            MessageViewComponent
        [web.Element/style]
            [web.scss/margin-inline-end]
                {scss/map-get}
                    {scss/$spacers}
                    1
`;
