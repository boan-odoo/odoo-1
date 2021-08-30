/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            voiceDetection
        [Element/model]
            RtcConfigurationMenuComponent
        [Element/isPresent]
            {Env/userSetting}
            .{UserSetting/usePushToTalk}
            .{isFalsy}
        [Record/traits]
            RtcConfigurationMenuComponent/option
`;
