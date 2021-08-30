/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Thread/computeLastCurrentPartnerMessageSeenByEveryone
        [Action/params]
            thread
                [type]
                    Thread
                [description]
                    the concerned thread
        [Action/behavior]
            :threads
                {if}
                    @thread
                .{then}
                    @thread
                .{else}
                    {Record/all}
                        [Record/traits]
                            Thread
            @threads
            .{Collection/map}
                {Record/insert}
                    [Record/traits]
                        Function
                    [Function/in]
                        localThread
                    [Function/out]
                        {Record/update}
                            [0]
                                @localThread
                            [1]
                                [Thread/lastCurrentPartnerMessageSeenByEveryone]
                                    {Thread/_computeLastCurrentPartnerMessageSeenByEveryone}
                                        @localThread
`;
