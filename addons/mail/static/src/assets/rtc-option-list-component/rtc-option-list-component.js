/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            RtcOptionListComponent
        [Model/fields]
            rtcOptionList
        [Model/template]
            root
                layout
                    layoutIcon
                    layoutLabel
                exitFullscreen
                    exitFullscreenIcon
                    exitFullscreenLabel
                fullscreen
                    fullscreenIcon
                    fullscreenLabel
                options
                    optionsIcon
                    optionsLabel
                downloadLogs
                    downloadLogsIcon
                    downloadLogsLabel
`;
