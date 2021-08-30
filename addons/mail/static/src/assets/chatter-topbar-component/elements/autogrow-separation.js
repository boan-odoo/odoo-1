/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            autogrowSeparation
        [Element/model]
            ChatterTopbarComponent
        [Record/traits]
            AutogrowComponent
`;
