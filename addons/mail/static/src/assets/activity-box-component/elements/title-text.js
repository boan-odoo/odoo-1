/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            titleText
        [Element/model]
            ActivityBoxComponent
        [web.Element/tag]
            span
`;
