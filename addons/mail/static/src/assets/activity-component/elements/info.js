/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            info
        [Element/model]
            ActivityComponent
        [web.Element/class]
            d-flex
            align-items-baseline
`;
