/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessagingInitializer/_initCannedResponses
        [Action/params]
            messagingInitializer
                [type]
                    MessagingInitializer
            cannedResponsesData
                [type]
                    Collection<Object>
        [Action/behavior]
            {Record/update}
                [0]
                    @env
                [1]
                    [Env/cannedResponses]
                        {Field/add}
                            @cannedResponsesData
                            .{Collection/map}
                                {Record/insert}
                                    [Record/traits]
                                        Function
                                    [Function/in]
                                        item
                                    [Function/out]
                                        {Record/insert}
                                            [Record/traits]
                                                CannedResponse
                                            [CannedResponse/id]
                                                @item
                                                .{Dict/get}
                                                    id
                                            [CannedResponse/source]
                                                @item
                                                .{Dict/get}
                                                    source
                                            [CannedResponse/substitution]
                                                @item
                                                .{Dict/get}
                                                    substitution
`;
