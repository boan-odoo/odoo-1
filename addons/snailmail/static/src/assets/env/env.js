/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            snailmail
        [ModelAddon/model]
            Env
        [ModelAddon/fields]
            snailmailCreditsUrl
            snailmailCreditsUrlTrial
        [Model/actions]
            Env/fetchSnailmailCreditsUrl
            Env/fetchSnailmailCreditsUrlTrial
`;
