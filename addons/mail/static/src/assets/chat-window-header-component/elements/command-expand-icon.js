/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            commandExpandIcon
        [Element/model]
            ChatWindowHeaderComponent
        [web.Element/tag]
            i
        [web.Element/class]
            fa
            fa-expand
`;
