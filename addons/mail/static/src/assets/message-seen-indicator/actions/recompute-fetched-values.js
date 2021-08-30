/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessageSeenIndicator/recomputeFetchedValues
        [Action/params]
            channel
                [type]
                    Thread
        [Action/behavior]
            :indicatorFindFunction
                {if}
                    @channel
                .{then}
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            item
                        [Function/out]
                            @item
                            .{MessageSeenIndicator/thread}
                            .{=}
                                @channel
                .{else}
                    undefined
            :indicators
                {Record/all}
                    [Record/traits]
                        MessageSeenIndicator
                    @indicatorFindFunction
            {foreach}
                @indicators
            .{as}
                indicator
            .{do}
                {Record/update}
                    [0]
                        @indicator
                    [1]
                        [MessageSeenIndicator/hasEveryoneFetched]
                            {MessageSeenIndicator/_computeHasEveryoneFetched}
                                @indicator
                        [MessageSeenIndicator/hasSomeoneFetched]
                            {MessageSeenIndicator/_computeHasSomeoneFetched}
                                @indicator
                        [MessageSeenIndicator/partnersThatHaveFetched]
                            {MessageSeenIndicator/_computePartnersThatHaveFetched}
                                @indicator
`;
