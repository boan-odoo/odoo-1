/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            grouped notifications by document model
        [Test/model]
            NotificationListComponent
        [Test/assertions]
            12
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
                            {Test/step}
                                do_action
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        action
                                    .{Dict/get}
                                        name
                                    .{=}
                                        Mail Failures
                                []
                                    action should have 'Mail Failures' as name
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
                                    action should have the type act_window
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        action
                                    .{Dict/get}
                                        view_mode
                                    .{=}
                                        kanban,list,form
                                []
                                    action should have 'kanban,list,form' as view_mode
                            {Test/assert}
                                []
                                    {JSON/stringify}
                                        @payload
                                        .{Dict/get}
                                            action
                                        .{Dict/get}
                                            views
                                    .{=}
                                        {JSON/stringify}
                                            {Record/insert}
                                                [Record/traits]
                                                    Collection
                                                [0]
                                                    [0]
                                                        false
                                                    [1]
                                                        kanban
                                                [1]
                                                    [0]
                                                        false
                                                    [1]
                                                        list
                                                [2]
                                                    [0]
                                                        false
                                                    [1]
                                                        form
                                []
                                    action should have correct views
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        action
                                    .{Dict/get}
                                        target
                                    .{=}
                                        current
                                []
                                    action should have 'current' as target
                            {Test/assert}
                                []
                                    @payload
                                    .{Dict/get}
                                        action
                                    .{Dict/get}
                                        res_model
                                    .{=}
                                        res.partner
                                []
                                    action should have the group model as res_model
                            {Test/assert}
                                []
                                    {JSON/stringify}
                                        @payload
                                        .{Dict/get}
                                            action
                                        .{Dict/get}
                                            domain
                                    .{=}
                                        {JSON/stringify}
                                            {Record/insert}
                                                [Record/traits]
                                                    Collection
                                                [0]
                                                    message_has_error
                                                [1]
                                                    =
                                                [2]
                                                    true
                                []
                                    action should have 'message_has_error' as domain
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
                    [env/owlEnv]
                        [bus]
                            @bus
            @testEnv
            .{Record/insert}
                {Dev/comment}
                    If all failures linked to a document model refers to different documents,
                    a single notification should group all failures that are linked to this
                    document model.
                []
                    {Dev/comment}
                        first message that is expected to have a failure
                    [Record/traits]
                        mail.message
                    [mail.message/id]
                        11
                        {Dev/comment}
                            random unique id, will be used to link failure to message
                    [mail.message/message_type]
                        email
                        {Dev/comment}
                            message must be email (goal of the test)
                    [mail.message/model]
                        res.partner
                        {Dev/comment}
                            same model as second message (and not 'mail.channel')
                    [mail.message/res_id]
                        31
                        {Dev/comment}
                            different res_id from second message
                    [mail.message/res_model_name]
                        Partner
                        {Dev/comment}
                            random related model name
                []
                    {Dev/comment}
                        second message that is expected to have a failure
                    [Record/traits]
                        mail.message
                    [mail.message/id]
                        12
                        {Dev/comment}
                            random unique id, will be used to link failure to message
                    [mail.message/message_type]
                        email
                        {Dev/comment}
                            message must be email (goal of the test)
                    [mail.message/model]
                        res.partner
                        {Dev/comment}
                            same model as first message (and not 'mail.channel')
                    [mail.message/res_id]
                        32
                        {Dev/comment}
                            different res_id from first message
                    [mail.message/res_model_name]
                        Partner
                        {Dev/comment}
                            same related model name for consistency
                []
                    {Dev/comment}
                        first failure that is expected to be used in the test
                    [Record/traits]
                        mail.notification
                    [mail.notification/mail_message_id]
                        11
                        {Dev/comment}
                            id of the related first message
                    [mail.notification/notification_status]
                        exception
                        {Dev/comment}
                            one possible value to have a failure
                    [mail.notification/notification_type]
                        email
                        {Dev/comment}
                            expected failure type for email message
                []
                    {Dev/comment}
                        second failure that is expected to be used in the test
                    [Record/traits]
                        mail.notification
                    [mail.notification/mail_message_id]
                        12
                        {Dev/comment}
                            id of the related second message
                    [mail.notification/notification_status]
                        bounce
                        {Dev/comment}
                            other possible value to have a failure
                    [mail.notification/notification_type]
                        email
                        {Dev/comment}
                            expected failure type for email message
            @testEnv
                {Record/insert}
                    [Record/traits]
                        Server
                [Server/data]
                    @record
                    .{Test/data}
            :notificationListComponent
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        NotificationListComponent
            {Test/assert}
                []
                    @notificationListComponent
                    .{NotificationListComponent/group}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should have 1 notification group
            {Test/assert}
                []
                    @notificationListComponent
                    .{NotificationListComponent/group}
                    .{Collection/first}
                    .{NotificationGroupComponent/counter}
                []
                    should have 1 group counter
            {Test/assert}
                []
                    @notificationListComponent
                    .{NotificationListComponent/group}
                    .{Collection/first}
                    .{NotificationGroupComponent/counter}
                    .{web.Element/textContent}
                    .{=}
                        (2)
                []
                    should have 2 notifications in the group

            @testEnv
            .{UI/click}
                @notificationListComponent
                .{NotificationListComponent/group}
                .{Collection/first}
            {Test/verifySteps}
                []
                    do_action
                []
                    should do an action to display the related records
`;
