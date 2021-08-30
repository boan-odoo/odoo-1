/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            commandCloseNotAsBackIcon
        [Element/model]
            ChatWindowHeaderComponent
        [web.Element/tag]
            i
        [web.Element/class]
            fa
            fa-close
`;
