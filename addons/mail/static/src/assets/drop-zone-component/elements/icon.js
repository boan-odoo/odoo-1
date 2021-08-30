/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            icon
        [Element/model]
            DropZoneComponent
        [web.Element/tag]
            i
        [web.Element/class]
            fa
            fa-download
`;
