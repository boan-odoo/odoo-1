/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Performs the 'read' RPC on 'res.users'.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            User/performRpcRead
        [Action/params]
            context
                [type]
                    Object
            fields
                [type]
                    Collection<String>
            ids
                [type]
                    Collection<Integer>
        [Action/behavior]
            :usersData
                @env
                .{Env/owlEnv}
                .{Dict/get}
                    services
                .{Dict/get}
                    rpc
                .{Function/call}
                    [0]
                        [model]
                            res.users
                        [method]
                            read
                        [args]
                            {Record/insert}
                                [Record/traits]
                                    Collection
                                @ids
                        [kwargs]
                            [context]
                                @context
                            [fields]
                                @fields
                    [1]
                        [shadow]
                            true
            {Record/insert}
                [Record/traits]
                    User
                @usersData
                .{Collection/map}
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            item
                        [Function/out]
                            {User/convertData}
                                @item
`;
