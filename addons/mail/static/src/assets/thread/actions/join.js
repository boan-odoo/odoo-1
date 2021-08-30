/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Joins this thread. Only makes sense on channels.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Thread/join
        [Action/params]
            record
                [type]
                    Thread
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
                    add_members
                [args]
                    {Record/insert}
                        [Record/traits]
                            Collection
                        {Record/insert}
                            [Record/traits]
                                Collection
                            @record
                            .{Thread/id}
                [kwargs]
                    [partner_ids]
                        {Env/currentPartner}
                        .{Partner/id}
`;
