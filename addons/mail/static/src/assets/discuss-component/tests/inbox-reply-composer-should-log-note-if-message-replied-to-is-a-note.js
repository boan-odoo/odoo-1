/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            inbox reply: composer should log note if message replied to is a note
        [Test/model]
            DiscussComponent
        [Test/assertions]
            6
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                [0]
                    [Record/traits]
                        mail.message
                    [mail.message/body]
                        not empty
                    [mail.message/id]
                        100
                    [mail.message/is_discussion]
                        false
                    [mail.message/model]
                        res.partner
                    [mail.message/needaction]
                        true
                    [mail.message/needaction_partner_ids]
                        @record
                        .{Test/data}
                        .{Data/currentPartnerId}
                    [mail.message/res_id]
                        20
                [1]
                    [Record/traits]
                        mail.notification
                    [mail.notification/mail_message_id]
                        100
                    [mail.notification/notification_status]
                        sent
                    [mail.notification/notification_type]
                        inbox
                    [mail.notification/res_partner_id]
                        @record
                        .{Test/data}
                        .{Data/currentPartnerId}
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
                [Server/mockRPC]
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            route
                            args
                        [Function/out]
                            {if}
                                @route
                                .{=}
                                    /mail/message/post
                            .{then}
                                {Test/step}
                                    /mail/message/post
                                {Test/assert}
                                    []
                                        @args
                                        .{Dict/get}
                                            post_data
                                        .{Dict/get}
                                            message_type
                                        .{=}
                                            comment
                                    []
                                        should set message type as 'comment'
                                {Test/assert}
                                    []
                                        @args
                                        .{Dict/get}
                                            post_data
                                        .{Dict/get}
                                            subtype_xmlid
                                        .{=}
                                            mail.mt_note
                                    []
                                        should set subtype_xmlid as 'note'
                            @original
            @testEnv
            .{Record/insert}
                [Record/traits]
                    DiscussComponent
            @testEnv
            .{Utils/waitUntilEvent}
                [eventName]
                    o-thread-view-hint-processed
                [message]
                    should wait until inbox displayed its messages
                [predicate]
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            hint
                            threadViewer
                        [Function/out]
                            @hint
                            .{Hint/type}
                            .{=}
                                messages-loaded
                            .{&}
                                @threadViewer
                                .{ThreadViewer/thread}
                                .{Thread/model}
                                .{=}
                                    mail.box
                            .{&}
                                @threadViewer
                                .{ThreadViewer/thread}
                                .{Thread/id}
                                .{=}
                                    inbox
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should display a single message

            @testEnv
            .{UI/click}
                @testEnv
                .{Discuss/thread}
                .{Thread/cache}
                .{ThreadCache/messages}
                .{Collection/first}
                .{Message/messageComponents}
                .{Collection/first}
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{Discuss/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/first}
                    .{Message/actionList}
                    .{MessageActionList/messageActionListComponents}
                    .{Collection/first}
                    .{MessageActionListComponent/actionReply}
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/composer}
                    .{Collection/first}
                    .{Composer/composerViewComponents}
                    .{Collection/first}
                    .{ComposerViewComponent/buttonSend}
                    .{web.Element/textContent}
                    .{=}
                        Log
                []
                    Send button text should be 'Log'

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/insertText}
                    Test
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{Discuss/composer}
                    .{Collection/first}
                    .{Composer/composerViewComponents}
                    .{Collection/first}
                    .{ComposerViewComponent/buttonSend}
            {Test/verifySteps}
                /mail/message/post
`;
