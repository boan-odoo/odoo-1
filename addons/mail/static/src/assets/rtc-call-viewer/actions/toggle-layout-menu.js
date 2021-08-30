/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            RtcCallViewer/toggleLayoutMenu
        [Action/params]
            record
                [type]
                    RtcCallViewer
        [Action/behavior]
            {if}
                @record
                .{RtcCallViewer/rtcLayoutMenu}
            .{then}
                {Record/update}
                    [0]
                        @record
                    [1]
                        [RtcCallViewer/rtcLayoutMenu]
                            {Record/insert}
                                [Record/traits]
                                    RtcLayoutMenu
            .{else}
                {Record/update}
                    [0]
                        @record
                    [1]
                        [RtcCallViewer/rtcLayoutMenu]
                            {Record/empty}
`;
