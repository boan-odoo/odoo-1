/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            titleText
        [Element/model]
            AttachmentBoxComponent
        [web.Element/tag]
            span
        [web.Element/textContent]
            {Locale/text}
                Attachments
`;
