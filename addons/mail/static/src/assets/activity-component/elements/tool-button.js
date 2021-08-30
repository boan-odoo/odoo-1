/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            toolButton
        [Element/model]
            ActivityComponent
        [Record/traits]
            Hoverable
`;
