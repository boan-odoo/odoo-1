/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Called when messaging is started.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Device/start
        [Action/params]
            device
        [Action/behavior]
            :_onResize
                {Record/insert}
                    [Record/traits]
                        Throttle
                    [Throttle/duration]
                        100
                    [Throttle/timeout]
                        {Device/_refresh}
                            @device
            {Record/update}
                [0]
                    @device
                [1]
                    [Device/_onResize]
                        @_onResize
            {web.Browser/onResize}
                @device
                .{Device/_onResize}
            {Device/refresh}
                @device
`;
