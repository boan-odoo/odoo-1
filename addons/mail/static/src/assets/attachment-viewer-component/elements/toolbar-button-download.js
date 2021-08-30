/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            toolbarButtonDownload
        [Element/model]
            AttachmentViewerComponent
        [Record/traits]
            AttachmentViewerComponent/toolbarButton
        [Element/onClick]
            {web.Event/stopPropagation}
                @ev
            {AttachmentViewerComponent/_download}
                @record
        [web.Element/title]
            {Locale/text}
                Download
        [web.Element/role]
            button
`;
