/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            voiceDetectionValue
        [Element/model]
            RtcConfigurationMenuComponent
        [Record/traits]
            RtcConfigurationMenuComponent/inputGroupValue
        [web.Element/textContent]
            {Env/userSetting}
            .{UserSetting/voiceActivationThreshold}
`;
