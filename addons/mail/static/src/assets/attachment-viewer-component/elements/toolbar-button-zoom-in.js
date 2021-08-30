/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            toolbarButtonZoomIn
        [Element/model]
            AttachmentViewerComponent
        [Record/traits]
            AttachmentViewerComponent/toolbarButton
        [Element/onClick]
            {web.Event/stopPropagation}
                @ev
            {AttachmentViewerComponent/_zoomIn}
                @record
        [web.Element/title]
            {Locale/text}
                Zoom In (+)
        [web.Element/role]
            button
`;
