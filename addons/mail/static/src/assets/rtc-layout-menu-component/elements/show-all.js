/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            showAll
        [Element/model]
            RtcLayoutMenuComponent
        [Record/traits]
            RtcLayoutMenuComponent/item
        [Element/isPresent]
            @record
            .{RtcLayoutMenuComponent/layoutMenu}
            .{RtcLayoutMenu/callViewer}
            .{RtcCallViewer/threadView}
            .{ThreadView/thread}
            .{Thread/videoCount}
            .{>}
                0
`;
