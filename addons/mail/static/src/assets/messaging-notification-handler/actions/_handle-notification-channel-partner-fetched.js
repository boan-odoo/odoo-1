/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessagingNotificationHandler/_handleNotificationChannelPartnerFetched
        [Action/params]
            channel_id
                [type]
                    Integer
                [as]
                    channelId
            notificationHandler
                [type]
                    MessagingNotificationHandler
            channelId
                [type]
                    Integer
            last_message_id
                [type]
                    Integer
            partner_id
                [type]
                    Integer
        [Action/behavior]
            :channel
                {Record/findById}
                    [Thread/id]
                        @channelId
                    [Thread/model]
                        mail.channel
            {if}
                @channel
                .{isFalsy}
            .{then}
                {Dev/comment}
                    for example seen from another browser, the current one
                    has no knowledge of the channel
                {break}
            {if}
                @channel
                .{Thread/channelType}
                .{=}
                    channel
            .{then}
                {Dev/comment}
                    disabled on 'channel' channels for performance reasons
                {break}
            {Record/insert}
                [Record/traits]
                    ThreadPartnerSeenInfo
                [ThreadPartnerSeenInfo/lastFetchedMessage]
                    {Record/insert}
                        [Record/traits]
                            Message
                        [Message/id]
                            @last_message_id
                [ThreadPartnerSeenInfo/partner]
                    {Record/insert}
                        [Record/traits]
                            Partner
                        [Partner/id]
                            @partner_id
                [ThreadPartnerSeenInfo/thread]
                    @channel
            {Record/insert}
                [Record/traits]
                    MessageSeenIndicator
                [MessageSeenIndicator/message]
                    {Record/insert}
                        [Record/traits]
                            Message
                        [Message/id]
                            @last_message_id
                [MessageSeenIndicator/thread]
                    @channel
            {Dev/comment}
                FIXME force the computing of message values (cf task-2261221)
            {MessageSeenIndicator/recomputeFetchedValues}
                @channel
`;
