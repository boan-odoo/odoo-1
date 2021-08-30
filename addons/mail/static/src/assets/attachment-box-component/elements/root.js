/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            root
        [Element/model]
            AttachmentBoxComponent
        [web.Element/class]
            position-relative
`;
