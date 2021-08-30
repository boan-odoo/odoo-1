/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Shows the overlay (buttons) for a set a mount of time.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            RtcCallViewer/_showOverlay
        [Action/params]
            record
                [type]
                    RtcCallViewer
        [Action/behavior]
            {Record/update}
                [0]
                    @record
                [1]
                    [RtcCallViewer/showOverlay]
                        true
            {RtcCallViewer/_debounce}
                [0]
                    {if}
                        {Record/exists}
                            @record
                        .{isFalsy}
                    .{then}
                        {break}
                    {Record/update}
                        [0]
                            @record
                        [1]
                            [RtcCallViewer/showOverlay]
                                false
                [1]
                    [delay]
                        3000
`;
