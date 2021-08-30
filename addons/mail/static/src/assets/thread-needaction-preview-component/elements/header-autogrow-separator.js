/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            headerAutogrowSeparator
        [Element/model]
            ThreadNeedactionPreviewComponent
        [web.Element/tag]
            span
        [Record/traits]
            AutogrowComponent
`;
