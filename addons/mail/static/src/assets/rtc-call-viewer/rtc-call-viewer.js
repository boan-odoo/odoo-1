/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            RtcCallViewer
        [Model/fields]
            _timeoutId
            aspectRatio
            device
            filterVideoGrid
            isControllerFloating
            isFullScreen
            isMinimized
            layout
            layoutSettingsTitle
            mainParticipantCard
            rtcController
            rtcLayoutMenu
            settingsTitle
            showOverlay
            threadView
            tileParticipantCards
        [Model/id]
            RtcCallViewer/threadView
        [Model/action]
            RtcCallViewer/_debounce
            RtcCallViewer/_onFullScreenChange
            RtcCallViewer/_showOverlay
            RtcCallViewer/activateFullScreen
            RtcCallViewer/deactivateFullScreen
            RtcCallViewer/onClick
            RtcCallViewer/onLayoutSettingsDialogClosed
            RtcCallViewer/onMousemove
            RtcCallViewer/onMousemoveOverlay
            RtcCallViewer/onRtcSettingsDialogClosed
            RtcCallViewer/toggleLayoutMenu
        [Model/onChanges]
            RtcCallViewer/_onChangeRtcChannel
            RtcCallViewer/_onChangeVideoCount
`;
