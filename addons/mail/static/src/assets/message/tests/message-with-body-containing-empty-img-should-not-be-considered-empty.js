/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            message with body "<img src=''>" should not be considered empty
        [Test/model]
            Message
        [Test/assertions]
            1
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            :server
                {Record/insert}
                    [Record/traits]
                        Server
                    [Server/data]
                        @record
                        .{Test/data}
            :message
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        Message
                    [Message/body]
                        <img src=''>
                    [Message/id]
                        11
            {Test/assert}
                @message
                .{message/isEmpty}
                .{isFalsy}
`;
