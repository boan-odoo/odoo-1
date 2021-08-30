/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            Notification Error
        [Test/feature]
            sms
        [Test/model]
            MessageViewComponent
        [Test/assertions]
            8
        [Test/scenario]
            :openResendActionDef
                {Record/insert}
                    [Record/traits]
                        Deferred
            :bus
                {Record/insert}
                    [Record/traits]
                        Bus
            {Bus/on}
                [0]
                    @bus
                [1]
                    do-action
                [2]
                    null
                [3]
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            payload
                        [Function/out]
                            {Test/step}
                                do_action
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        action
                                    .{=}
                                        sms.sms_resend_action
                                []
                                    action should be the one to resend sms
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        options
                                    .{Dict/get}
                                        additional_context
                                    .{Dict/get}
                                        default_mail_message_id
                                    .{=}
                                        10
                                []
                                    action should have correct message id
                            {Promise/resolve}
                                @openResendActionDef
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
                    [Env/owlEnv]
                        [bus]
                            @bus
            @testEnv
            .{Record/insert}
                []
                    [Record/traits]
                        mail.channel
                    [mail.channel/id]
                        11
                []
                    [Record/traits]
                        mail.message
                    [mail.message/body]
                        not empty
                    [mail.message/id]
                        10
                    [mail.message/message_type]
                        sms
                    [mail.message/model]
                        mail.channel
                    [mail.message/res_id]
                        11
                []
                    [Record/traits]
                        mail.notification
                    [mail.notification/id]
                        11
                    [mail.notification/mail_message_id]
                        10
                    [mail.notification/notification_status]
                        exception
                    [mail.notification/notification_type]
                        sms
                    [mail.notification/res_partner_id]
                        12
                []
                    [Record/traits]
                        res.partner
                    [res.partner/id]
                        12
                    [res.partner/name]
                        Someone
                    [res.partner/partner_share]
                        true
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
            {Test/assert}
                []
                    @threadViewer
                    .{ThreadViewer/threadView}
                    .{ThreadView/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should display a message component
            {Test/assert}
                []
                    @threadViewer
                    .{ThreadViewer/threadView}
                    .{ThreadView/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/first}
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/notificationIconClickable}
                []
                    should display the notification icon container
            {Test/assert}
                []
                    @threadViewer
                    .{ThreadViewer/threadView}
                    .{ThreadView/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/first}
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/notificationIcon}
                []
                    should display the notification icon
            {Test/assert}
                []
                    @threadViewer
                    .{ThreadViewer/threadView}
                    .{ThreadView/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/first}
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/notificationIconSms}
                []
                    icon should represent sms

            @testEnv
            .{UI/click}
                @threadViewer
                .{ThreadViewer/threadView}
                .{ThreadView/thread}
                .{Thread/cache}
                .{ThreadCache/messages}
                .{Collection/first}
                .{Message/messageComponents}
                .{Collection/first}
                .{MessageViewComponent/notificationIconClickable}
            {Promise/await}
                @openResendActionDef
            {Test/verifySteps}
                []
                    do_action
                []
                    should do an action to display the resend sms dialog
`;
