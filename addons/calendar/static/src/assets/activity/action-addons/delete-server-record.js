/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ActionAddon
        [ActionAddon/feature]
            calendar
        [ActionAddon/action]
            Activity/deleteServerRecord
        [ActionAddon/behavior]
            {if}
                @record
                .{Activity/calendarEventId}
                .{isFalsy}
            .{then}
                @original
            .{else}
                {Record/doAsync}
                    [0]
                        @record
                    [1]
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
                                unlink_w_meeting
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
