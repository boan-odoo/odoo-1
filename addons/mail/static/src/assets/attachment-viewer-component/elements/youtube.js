/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            youtube
        [Element/model]
            AttachmentViewerComponent
        [web.Element/tag]
            iframe
        [Record/traits]
            AttachmentViewerComponent/view
            AttachmentViewerComponent/viewIframe
        [web.Element/allow]
            'autoplay; encrypted-media'
        [web.Element/height]
            315
        [web.Element/width]
            560
        [web.Element/isPresent]
            @record
            .{AttachmentViewerComponent/record}
            .{AttachmentViewer/attachment}
            .{Attachment/isUrlYoutube}
        [web.Element/src]
            @record
            .{AttachmentViewerComponent/record}
            .{AttachmentViewer/attachment}
            .{Attachment/defaultSource}
`;
