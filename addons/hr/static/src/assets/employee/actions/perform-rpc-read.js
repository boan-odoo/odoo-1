/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Performs the 'read' RPC on the 'hr.employee.public'.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Employee/performRpcRead
        [Action/params]
            [context]
                [type]
                    Object
            [fields]
                [type]
                    Collection<String>
            [ids]
                [type]
                    Collection<Integer>
        [Action/behavior]
            :dataList
                @env
                .{Env/owlEnv}
                .{Dict/get}
                    services
                .{Dict/get}
                    rpc
                .{Function/call}
                    [model]
                        hr.employee.public
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
            {Record/insert}
                [Record/traits]
                    Employee
                @dataList
                .{Collection/map}
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            item
                        [Function/out]
                            {Employee/convertData}
                                @item
`;
