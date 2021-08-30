/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            rtcCallViewer
        [Element/model]
            ThreadViewComponent
        [Field/target]
            RtcCallViewerComponent
        [Element/isPresent]
            @record
            .{ThreadViewComponent/threadView}
            .{ThreadView/rtcCallViewer}
        [RtcCallViewerComponent/rtcCallViewer]
            @record
            .{ThreadViewComponent/threadView}
            .{ThreadView/rtcCallViewer}
`;
