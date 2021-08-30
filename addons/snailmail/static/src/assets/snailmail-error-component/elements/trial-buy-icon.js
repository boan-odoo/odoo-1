/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            trialBuyIcon
        [Element/model]
            SnailmailErrorComponent
        [web.Element/tag]
            i
        [web.Element/class]
            fa
            fa-arrow-right
`;
