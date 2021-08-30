/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            separator1
        [Element/model]
            ThreadTypingIconComponent
        [web.Element/tag]
            span
        [Record/traits]
            ThreadTypingIconComponent/separator
`;
