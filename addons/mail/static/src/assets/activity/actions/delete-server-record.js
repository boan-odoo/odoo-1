/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Delete the record from database and locally.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Activity/deleteServerRecord
        [Action/params]
            record
                [type]
                    Activity
        [Action/behavior]
            {Record/doAsync}
                []
                    @record
                []
                    @env
                    .{Env/owlEnv}
                    .{Dict/get}
                        services
                    .{Dict/get}
                        rpc
                    .{Function/call}
                        [model]
                            mail.activity
                        [method]
                            unlink
                        [args]
                            {Record/insert}
                                [Record/traits]
                                    Collection
                                {Record/insert}
                                    [Record/traits]
                                        Collection
                                    @record
                                    .{Activity/id}
            {Record/delete}
                @record
`;
