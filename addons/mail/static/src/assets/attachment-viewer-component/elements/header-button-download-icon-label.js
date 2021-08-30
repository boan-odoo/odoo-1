/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            headerButtonDownloadLabel
        [Element/model]
            AttachmentViewerComponent
        [web.Element/tag]
            span
        [Element/isPresent]
            {Device/isSmall}
            .{isFalsy}
        [web.Element/textContent]
            {Locale/text}
                Download
`;
