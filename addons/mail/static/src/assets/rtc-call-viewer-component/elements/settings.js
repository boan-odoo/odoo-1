/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            settings
        [Element/model]
            RtcCallViewerComponent
        [Record/traits]
            DialogComponent
        [DialogComponent/size]
            small
        [DialogComponent/title]
            @record
            .{RtcCallViewerComponent/rtcCallViewer}
            .{RtcCallViewer/settingsTitle}
        [DialogComponent/onClosed]
            {RtcCallViewer/onRtcSettingsDialogClosed}
                [0]
                    @record
                    .{RtcCallViewerComponent/rtcCallViewer}
                [1]
                    @ev
        [Element/isPresent]
            {Env/userSetting}
            .{UserSetting/rtcConfigurationMenu}
            .{RtcConfigurationMenu/isOpen}
`;
