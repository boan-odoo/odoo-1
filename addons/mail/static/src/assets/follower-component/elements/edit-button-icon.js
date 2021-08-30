/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            editButtonIcon
        [Element/model]
            FollowerComponent
        [web.Element/tag]
            i
        [web.Element/class]
            fa
            fa-pencil
`;
