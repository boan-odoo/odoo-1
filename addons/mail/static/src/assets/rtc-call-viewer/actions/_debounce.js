/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            RtcCallViewer/_debounce
        [Action/params]
            delay
                [type]
                    Integer
            f
                [type]
                    Function
            record
                [type]
                    RtcCallViewer
        [Action/behavior]
            {Browser/clearTimeout}
                @record
                .{RtcCallViewer/_timeoutId}
            {Record/update}
                [0]
                    @record
                [1]
                    [RtcCallViewer/_timeoutId]
                        {Browser/setTimeout}
                            [0]
                                {if}
                                    {Record/exists}
                                        @record
                                    .{isFalsy}
                                .{then}
                                    {break}
                                @f
                                .{Function/call}
                            [1]
                                @delay
`;
