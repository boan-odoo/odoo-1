/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            needaction preview should only show on its origin thread
        [Test/model]
            ThreadNeedactionPreviewComponent
        [Test/assertions]
            2
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                []
                    [Record/traits]
                        mail.channel
                    [mail.channel/id]
                        12
                []
                    [Record/traits]
                        mail.message
                    [mail.message/channel_ids]
                        12
                    [mail.message/id]
                        21
                    [mail.message/model]
                        res.partner
                    [mail.message/needaction]
                        true
                    [mail.message/needaction_partner_ids]
                        @record
                        .{Test/data}
                        .{Data/currentPartnerId}
                    [mail.message/res_id]
                        11
                []
                    [Record/traits]
                        mail.notification
                    [mail.notification/mail_message_id]
                        21
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
            @testEnv
            .{Record/insert}
                [Record/traits]
                    MessagingMenuComponent
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/afterEvent}
                    [eventName]
                        o-thread-cache-loaded-messages
                    [func]
                        @testEnv
                        .{UI/click}
                            @testEnv
                            .{MessagingMenu/messagingMenuComponents}
                            .{Collection/first}
                            .{MessagingMenuComponent/toggler}
                    [message]
                        should wait until inbox loaded initial needaction messages
                    [predicate]
                        {Record/insert}
                            [Record/traits]
                                Function
                            [Function/in]
                                threadCache
                            [Function/out]
                                @threadCache
                                .{ThreadCache/thread}
                                .{Thread/model}
                                .{=}
                                    mail.box
                                .{&}
                                    @threadCache
                                    .{ThreadCache/thread}
                                    .{Thread/id}
                                    .{=}
                                        inbox
            {Test/assert}
                []
                    @testEnv
                    .{MessagingMenu/messagingMenuComponents}
                    .{Collection/first}
                    .{MessagingMenuComponent/notificationList}
                    .{NotificationListComponent/threadNeedactionPreview}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should have only one preview
            {Test/assert}
                []
                    @testEnv
                    .{Record/findById}
                        [Thread/id]
                            11
                        [Thread/model]
                            res.partner
                    .{Thread/threadNeedactionPreviews}
                    .{Collection/length}
                    .{=}
                        1
                []
                    preview should be on the origin thread
`;
