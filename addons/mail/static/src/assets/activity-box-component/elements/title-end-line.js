/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            titleEndLine
        [Element/model]
            ActivityBoxComponent
        [Record/traits]
            ActivityBoxComponent/titleLine
        [web.Element/class]
            ms-3
`;
