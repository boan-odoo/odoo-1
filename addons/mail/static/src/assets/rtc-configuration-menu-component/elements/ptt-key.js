/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            pttKey
        [Element/model]
            RtcConfigurationMenuComponent
        [Record/traits]
            RtcConfigurationMenuComponent/option
        [Element/isPresent]
            {Env/userSetting}
            .{UserSetting/usePushToTalk}
`;
