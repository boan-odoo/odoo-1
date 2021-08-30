/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            name
        [Element/model]
            AttachmentViewerComponent
        [Record/traits]
            AttachmentViewerComponent/headerItem
        [web.Element/style]
            [web.scss/margin]
                0
                {scss/map-get}
                    {scss/$spacers}
                    2
            [web.scss/min-width]
                0
`;
