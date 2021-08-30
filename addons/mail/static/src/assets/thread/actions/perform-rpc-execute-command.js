/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Performs the 'execute_command' RPC on 'mail.channel'.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Thread/performRpcExecuteCommand
        [Action/params]
            channelId
                [type]
                    Integer
            command
                [type]
                    String
            postData
                [type]
                    Object
                [default]
                    {Record/insert}
                        [Record/traits]
                            Object
        [Action/behavior]
            @env
            .{Env/owlEnv}
            .{Dict/get}
                services
            .{Dict/get}
                rpc
            .{Function/call}
                [model]
                    mail.channel
                [method]
                    execute_command
                [args]
                    {Record/insert}
                        [Record/traits]
                            Collection
                        {Record/insert}
                            [Record/traits]
                                Collection
                            @channelId
                [kwargs]
                    {Record/insert}
                        [Record/traits]
                            Object
                        [command]
                            @command
                        @postData
`;
