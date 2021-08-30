/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            dashedLineEnd
        [Element/model]
            AttachmentBoxComponent
        [web.Element/tag]
            hr
        [Record/traits]
            AttachmentBoxComponent/dashedLine
`;
