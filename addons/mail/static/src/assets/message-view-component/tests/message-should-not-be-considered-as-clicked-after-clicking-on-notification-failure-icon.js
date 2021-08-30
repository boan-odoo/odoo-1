/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            message should not be considered as "clicked" after clicking on notification failure icon
        [Test/model]
            MessageViewComponent
        [Test/assertions]
            1
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                [0]
                    [Record/traits]
                        mail.channel
                    [mail.channel/id]
                        10
                [1]
                    [Record/traits]
                        mail.message
                    [mail.message/body]
                        not empty
                    [mail.message/id]
                        10
                    [mail.message/model]
                        mail.channel
                    [mail.message/res_id]
                        11
                [2]
                    [Record/traits]
                        mail.notification
                    [mail.notification/id]
                        11
                    [mail.notification/mail_message_id]
                        10
                    [mail.notification/notification_status]
                        exception
                    [mail.notification/notification_type]
                        email
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
            :threadViewer
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        ThreadViewer
                    [ThreadViewer/hasThreadView]
                        true
                    [ThreadViewer/thread]
                        @testEnv
                        .{Record/insert}
                            [Record/traits]
                                Thread
                            [Thread/id]
                                11
                            [Thread/model]
                                mail.channel
            @testEnv
            .{Record/insert}
                [Record/traits]
                    ThreadViewComponent
                [ThreadViewComponent/threadView]
                    @threadViewer
                    .{ThreadViewer/threadView}
            @testEnv
            .{UI/click}
                @testEnv
                .{Record/all}
                    [Record/traits]
                        MessageViewComponent
                .{Collection/first}
                .{MessageViewComponent/notificationFailureIcon}
            {Utils/nextAnimationFrame}
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            MessageViewComponent
                    .{Collection/first}
                    .{MessageViewComponent/isClicked}
                    .{isFalsy}
                []
                    message should not be considered as 'clicked' after clicking on notification failure icon
`;
