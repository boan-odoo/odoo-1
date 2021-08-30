/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            hr
        [ModelAddon/model]
            Env
        [ModelAddon/actionAddons]
            Env/getChat
            Env/openProfile
`;
