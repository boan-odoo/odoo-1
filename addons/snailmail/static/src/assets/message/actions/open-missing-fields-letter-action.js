/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Opens the action about 'snailmail.letter' missing fields.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Message/openMissingFieldsLetterAction
        [Action/feature]
            snailmail
        [Action/params]
            message
                [type]
                    Message
        [Action/behavior]
            :letterIds
                {Record/doAsync}
                    [0]
                        @message
                    [1]
                        @env
                        .{Env/owlEnv}
                        .{Dict/get}
                            services
                        .{Dict/get}
                            rpc
                        .{Function/call}
                            [model]
                                snailmail.letter
                            [method]
                                search
                            [args]
                                {Record/insert}
                                    [Record/traits]
                                        Collection
                                    {Record/insert}
                                        [Record/traits]
                                            Collection
                                        message_id
                                        .{=}
                                            @message
                                            .{Message/id}
            @env
            .{Env/owlEnv}
            .{Dict/get}
                bus
            .{Dict/get}
                trigger
            .{Function/call}
                [0]
                    do-action
                [1]
                    [action]
                        snailmail.snailmail_letter_missing_required_fields_action
                    [options]
                        [additional_context]
                            [default_letter_id]
                                @letterIds
                                .{Collection/first}
`;
