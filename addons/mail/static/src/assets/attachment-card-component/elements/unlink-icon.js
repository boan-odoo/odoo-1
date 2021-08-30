/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            unlinkIcon
        [Element/model]
            AttachmentCardComponent
        [web.Element/tag]
            i
        [web.Element/class]
            fa
            fa-trash
`;
