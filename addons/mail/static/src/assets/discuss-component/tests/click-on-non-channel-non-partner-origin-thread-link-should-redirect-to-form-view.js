/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            click on (non-channel/non-partner) origin thread link should redirect to form view
        [Test/model]
            DiscussComponent
        [Test/assertions]
            9
        [Test/scenario]
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
                            {Dev/comment}
                                Callback of doing an action (action manager).
                                Expected to be called on click on origin thread
                                link, which redirects to form view of record
                                related to origin thread
                            {Test/step}
                                do-action
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        action
                                    .{Dict/get}
                                        type
                                    .{=}
                                        ir.actions.act_window
                                []
                                    action should open a view
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        action
                                    .{Dict/get}
                                        views
                                    .{=}
                                        {Record/insert}
                                            [Record/traits]
                                                Collection
                                            {Record/insert}
                                                [Record/traits]
                                                    Collection
                                                [0]
                                                    false
                                                [1]
                                                    form
                                []
                                    action should open form view
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        action
                                    .{Dict/get}
                                        res_model
                                    .{=}
                                        some.model
                                []
                                    action should open view with model 'some.model' (model of message origin thread)
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        action
                                    .{Dict/get}
                                        res_id
                                    .{=}
                                        10
                                []
                                    action should open view with id 10 (id of message origin thread)
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
                    [Env/owlEnv]
                        [bus]
                            @bus
            @testEnv
            .{Record/insert}
                [0]
                    [Record/traits]
                        mail.message
                    [mail.message/body]
                        not empty
                    [mail.message/id]
                        100
                    [mail.message/model]
                        some.model
                    [mail.message/needaction]
                        true
                    [mail.message/needaction_partner_ids]
                        @record
                        .{Test/data}
                        .{Data/currentPartnerId}
                    [mail.message/res_id]
                        10
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
                [2]
                    [Record/traits]
                        some.model
                    [some.model/id]
                        10
                    [some.model/name]
                        Some record
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
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
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/first}
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/originThreadLink}
                []
                    should display origin thread link
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/first}
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/originThreadLink}
                    .{web.Element/textContent}
                    .{=}
                        Some record
                []
                    origin thread link should display record name

            @testEnv
            .{UI/click}
                @testEnv
                .{Discuss/thread}
                .{Thread/cache}
                .{ThreadCache/messages}
                .{Collection/first}
                .{Message/messageComponents}
                .{Collection/first}
                .{MessageViewComponent/originThreadLink}
            {Test/verifySteps}
                []
                    do-action
                []
                    should have made an action on click on origin thread (to open form view)
`;
