/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            RtcCallViewer/onRtcSettingsDialogClosed
        [Action/params]
            ev
                [type]
                    CustomEvent
            record
                [type]
                    RtcCallViewer
        [Action/behavior]
            {RtcConfigurationMenu/toggle}
                {Env/userSetting}
                .{UserSetting/rtcConfigurationMenu}
`;
