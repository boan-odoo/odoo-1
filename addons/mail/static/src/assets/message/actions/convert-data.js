/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Message/convertData
        [Action/params]
            data
                [type]
                    Object
        [Action/behavior]
            :data2
                {Record/insert}
                    [Record/traits]
                        Object
            {if}
                @data
                .{Dict/hasKey}
                    attachment_ids
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/attachments]
                            {if}
                                @data
                                .{Dict/get}
                                    attachment_ids
                            .{then}
                                {Record/empty}
                            .{else}
                                @data
                                .{Dict/get}
                                    attachment_ids
                                .{Collection/map}
                                    {Record/insert}
                                        [Record/traits]
                                            Function
                                        [Function/in]
                                            item
                                        [Function/out]
                                            {Record/insert}
                                                [Record/traits]
                                                    Attachment
                                                {Attachment/convertData}
                                                    @item
            {if}
                @data
                .{Dict/hasKey}
                    author_id
            .{then}
                {if}
                    @data
                    .{Dict/get}
                        author_id
                .{then}
                    {Record/update}
                        [0]
                            @data2
                        [1]
                            [Message/author]
                                {Record/empty}
                .{elif}
                    @data
                    .{Dict/get}
                        author_id
                    .{Collection/first}
                    .{!=}
                        0
                .{then}
                    {Dev/comment}
                        partner id 0 is a hack of message_format to refer to an
                        author non-related to a partner. display_name equals
                        email_from, so this is omitted due to being redundant.
                    {Record/update}
                        [0]
                            @data2
                        [1]
                            [Message/author]
                                {Record/insert}
                                    [Record/traits]
                                        Partner
                                    [Partner/displayName]
                                        @data
                                        .{Dict/get}
                                            author_id
                                        .{Collection/second}
                                    [Partner/id]
                                        @data
                                        .{Dict/get}
                                            author_id
                                        .{Collection/first}
            {if}
                @data
                .{Dict/hasKey}
                    body
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/body]
                            @data
                            .{Dict/get}
                                body
            {if}
                @data
                .{Dict/hasKey}
                    date
                .{&}
                    @data
                    .{Dict/get}
                        date
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/date]
                            {Record/insert}
                                [Record/traits]
                                    Moment
                                {String/toDatetime}
                                    @data
                                    .{Dict/get}
                                        date
            {if}
                @data
                .{Dict/hasKey}
                    email_from
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/emailFrom]
                            @data
                            .{Dict/get}
                                email_from
            {if}
                @data
                .{Dict/hasKey}
                    guestAuthor
                .{then}
                    {Record/update}
                        [0]
                            @data2
                        [1]
                            [Message/guestAuthor]
                                @data
                                .{Dict/get}
                                    guestAuthor
            .{then}
            {if}
                @data
                .{Dict/hasKey}
                    history_partner_ids
                .{&}
                    {Env/currentPartner}
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/isHistory]
                            @data
                            .{Dict/get}
                                history_partner_ids
                            .{Collection/includes}
                                {Env/currentPartner}
                                .{Partner/id}
            {if}
                @data
                .{Dict/hasKey}
                    id
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/id]
                            @data
                            .{Dict/get}
                                id
            {if}
                @data
                .{Dict/hasKey}
                    is_discussion
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/isDiscussion]
                            @data
                            .{Dict/get}
                                is_discussion
            {if}
                @data
                .{Dict/hasKey}
                    is_note
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/isNote]
                            @data
                            .{Dict/get}
                                is_note
            {if}
                @data
                .{Dict/hasKey}
                    is_notification
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/isNotification]
                                @data
                                .{Dict/get}
                                    is_notification
            {if}
                @data
                .{Dict/hasKey}
                    messageReactionGroups
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/messageReactionGroups]
                            @data
                            .{Dict/get}
                                messageReactionGroups
            {if}
                @data
                .{Dict/hasKey}
                    message_type
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/type]
                            @data
                            .{Dict/get}
                                message_type
            {if}
                @data
                .{Dict/hasKey}
                    model
                .{&}
                    @data
                    .{Dict/hasKey}
                        res_id
                .{&}
                    @data
                    .{Dict/get}
                        model
                .{&}
                    @data
                    .{Dict/get}
                        res_id
            .{then}
                :originThreadData
                    [Thread/id]
                        @data
                        .{Dict/get}
                            res_id
                    [Thread/model]
                        @data
                        .{Dict/get}
                            model
                {if}
                    @data
                    .{Dict/hasKey}
                        record_name
                    .{&}
                        @data
                        .{Dict/get}
                            record_name
                .{then}
                    {Record/update}
                        [0]
                            @originThreadData
                        [1]
                            [Thread/name]
                                @data
                                .{Dict/get}
                                    record_name
                {if}
                    @data
                    .{Dict/hasKey}
                        res_model_name
                    .{&}
                        @data
                        .{Dict/get}
                            res_model_name
                .{then}
                    {Record/update}
                        [0]
                            @originThreadData
                        [1]
                            [Thread/modelName]
                                @data
                                .{Dict/get}
                                    res_model_name
                {if}
                    @data
                    .{Dict/hasKey}
                        module_icon
                .{then}
                    {Record/update}
                        [0]
                            @originThreadData
                        [1]
                            [Thread/moduleIcon]
                                @data
                                .{Dict/get}
                                    module_icon
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/originThread]
                            {Record/insert}
                                [Record/traits]
                                    Thread
                                @originThreadData
            {if}
                @data
                .{Dict/hasKey}
                    needaction_partner_ids
                .{&}
                    {Env/currentPartner}
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/isNeedaction]
                            @data
                            .{Dict/get}
                                needaction_partner_ids
                            .{Collection/includes}
                                {Env/currentPartner}
                                .{Partner/id}
            {if}
                @data
                .{Dict/hasKey}
                    notifications
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/notifications]
                            {Field/add}
                                @data
                                .{Dict/get}
                                    notifications
                                .{Collection/map}
                                    {Record/insert}
                                        [Record/traits]
                                            Function
                                        [Function/in]
                                            item
                                        [Function/out]
                                            {Record/insert}
                                                [Record/traits]
                                                    Notification
                                                {Notification/convertData}
                                                    @item
            {if}
                @data
                .{Dict/hasKey}
                    parentMessage
            .{then}
                {if}
                    @data
                    .{Dict/get}
                        parentMessage
                    .{isFalsy}
                .{then}
                    {Record/update}
                        [0]
                            @data2
                        [1]
                            [Message/parentMessage]
                                {Record/empty}
                .{else}
                    {Record/update}
                        [0]
                            @data2
                        [1]
                            [Message/parentMessage]
                                {Record/insert}
                                    [Record/traits]
                                        Message
                                    {Message/convertData}
                                        @data
                                        .{Dict/get}
                                            parentMessage
            {if}
                @data
                .{Dict/hasKey}
                    recipients
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/recipients]
                            @data
                            .{Dict/get}
                                recipients
            {if}
                @data
                .{Dict/hasKey}
                    starred_partner_ids
                .{&}
                    {Env/currentPartner}
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/isStarred]
                            @data
                            .{Dict/get}
                                starred_partner_ids
                            .{Collection/includes}
                                {Env/currentPartner}
                                .{Partner/id}
            {if}
                @data
                .{Dict/hasKey}
                    subject
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/subject]
                            @data
                            .{Dict/get}
                                subject
            {if}
                @data
                .{Dict/hasKey}
                    subtype_description
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/subtypeDescription]
                            @data
                            .{Dict/get}
                                subtype_description
            {if}
                @data
                .{Dict/hasKey}
                    subtype_id
            .{then}
                {Record/update}
                    [0]
                        @data
                    [1]
                        [Message/subtypeId]
                            @data
                            .{Dict/get}
                                subtype_id
            {if}
                @data
                .{Dict/hasKey}
                    tracking_value_ids
            .{then}
                {Record/update}
                    [0]
                        @data2
                    [1]
                        [Message/trackingValues]
                            @data
                            .{Dict/get}
                                tracking_value_ids
            @data2;
`;
