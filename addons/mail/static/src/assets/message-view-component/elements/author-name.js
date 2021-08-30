/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            authorName
        [Element/model]
            MessageViewComponent
        [web.Element/class]
            text-truncate
        [web.Element/style]
            [web.scss/margin-inline-end]
                {scss/map-get}
                    {scss/$spacers}
                    2
            [web.scss/font-weight]
                {scss/$font-weight-bold}
`;
