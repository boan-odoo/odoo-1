/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            viewPdf
        [Element/model]
            AttachmentViewerComponent
        [web.Element/tag]
            iframe
        [Record/traits]
            AttachmentViewerComponent/view
            AttachmentViewerComponent/viewIframe
        [Element/isPresent]
            @record
            .{AttachmentViewerComponent/record}
            .{AttachmentViewer/attachment}
            .{Attachment/isPdf}
        [web.Element/src]
            @record
            .{AttachmentViewerComponent/record}
            .{AttachmentViewer/attachment}
            .{Attachment/defaultSource}
`;
