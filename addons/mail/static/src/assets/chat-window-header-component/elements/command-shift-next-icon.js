/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        this is reversed automatically when language is rtl
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            commandShiftNextIcon
        [Element/model]
            ChatWindowHeaderComponent
        [web.Element/tag]
            i
        [web.Element/class]
            fa
            fa-angle-right
`;
