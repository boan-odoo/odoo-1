/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            pttDelayValue
        [Element/model]
            RtcConfigurationMenuComponent
        [Record/traits]
            RtcConfigurationMenuComponent/inputGroupValue
        [web.Element/textContent]
            {String/sprintf}
                [0]
                    {Locale/text}
                        %(s)ms
                [1]
                    {Env/userSetting}
                    .{UserSetting/voiceActiveDuration}
`;
