/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            UserSetting
        [Model/fields]
            _timeoutIds
            audioInputDeviceId
            id
            isRtcLayoutSettingDialogOpen
            pushToTalkKey
            rtcConfigurationMenu
            rtcLayout
            usePushToTalk
            voiceActivationThreshold
            voiceActiveDuration
            volumeSettings
        [Model/id]
            UserSetting/id
        [Model/actions]
            UserSetting/_debounce
            UserSetting/_loadLocalSettings
            UserSetting/_saveSettings
            UserSetting/convertData
            UserSetting/getAudioContaints
            UserSetting/isPushToTalkKey
            UserSetting/pushToTalkKeyFormat
            UserSetting/pushToTalkKeyToString
            UserSetting/saveVolumeSetting
            UserSetting/setAudioInputDevice
            UserSetting/setDelayValue
            UserSetting/setPushToTalkKey
            UserSetting/setThresholdValue
            UserSetting/toggleLayoutSettingsWindow
            UserSetting/togglePushToTalk
            UserSetting/toggleWindow
        [Model/lifecycles]
            onCreate
            onDelete
`;
