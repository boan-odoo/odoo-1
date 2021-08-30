/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            headerButtonDownloadIcon
        [Element/model]
            AttachmentViewerComponent
        [web.Element/tag]
            i
        [Record/traits]
            AttachmentViewerComponent/headerItemButtonIcon
        [web.Element/class]
            fa
            fa-download
            fa-fw
        [web.Element/role]
            img
`;
