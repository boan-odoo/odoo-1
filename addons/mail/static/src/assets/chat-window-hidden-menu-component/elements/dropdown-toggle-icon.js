/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            dropdownToggleIcon
        [Element/model]
            ChatWindowHiddenMenuComponent
        [Record/traits]
            ChatWindowHiddenMenuComponent/dropdownToggleItem
        [web.Element/class]
            fa
            fa-comments-o
`;
