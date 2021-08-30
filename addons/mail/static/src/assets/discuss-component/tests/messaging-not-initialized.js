/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            messaging not initialized
        [Test/model]
            DiscussComponent
        [Test/assertions]
            1
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
                    [Env/waitUntilMessagingCondition]
                        created
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
                [Server/mockRPC]
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            route
                            args
                            original
                        [Function/out]
                            {if}
                                @route
                                .{=}
                                    /mail/init_messaging
                            .{then}
                                {Dev/comment}
                                    simulate messaging never initialized
                                {Promise/await}
                            @original
            @testEnv
            .{Record/insert}
                [Record/traits]
                    DiscussComponent
            {Test/assert}
                []
                    @testEnv
                    .{DiscussContainerComponent/spinner}
                []
                    should display messaging not initialized
`;
