/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            trialBuy
        [Element/model]
            SnailmailErrorComponent
        [web.Element/tag]
            a
        [web.Element/class]
            btn
            btn-link
        [web.Element/href]
            {Env/snailmailCreditsUrlTrial}
`;
