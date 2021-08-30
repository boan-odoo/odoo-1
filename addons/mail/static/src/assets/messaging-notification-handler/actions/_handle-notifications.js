/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessagingNotificationHandler/_handleNotifications
        [Action/params]
            record
                [type]
                    MessagingNotificationHandler
            notifications
                [type]
                    Collection<Object>
                [description]
                    @param {Array|string} notifications[i][0] meta-data of the
                      notification.
                    @param {string} notifications[i][0][0] name of database this
                      notification comes from.
                    @param {string} notifications[i][0][1] type of notification.
                    @param {integer} notifications[i][0][2] usually id of related
                      type of notification. For instance, with 'mail.channel',
                      this is the id of the channel.
                    @param {Object} notifications[i][1] payload of the notification
        [Action/behavior]
            :channelsLeft
                {Record/insert}
                    [Record/traits]
                        Set
                    @notifications
                    .{Collection/filter}
                        {Record/insert}
                            [Record/traits]
                                Function
                            [Function/in]
                                notification
                            [Function/out]
                                @notification
                                .{Dict/get}
                                    type
                                .{=}
                                    mail.channel/leave
                    .{Collection/map}
                        {Record/insert}
                            [Record/traits]
                                Function
                            [Function/in]
                                notification
                            [Function/out]
                                @notification
                                .{Dict/get}
                                    payload
                                .{Dict/get}
                                    id
            :proms
                @notifications
                .{Collection/map}
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            message
                        [Function/out]
                            {if}
                                @message
                                .{typeof}
                                .{=}
                                    object
                            .{then}
                                {switch}
                                    @message
                                    .{Dict/get}
                                        type
                                .{case}
                                    [ir.attachment/delete]
                                        {MessagingNotificationHandler/_handleNotificationAttachmentDelete}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel.partner/seen]
                                        {MessagingNotificationHandler/_handleNotificationChannelPartnerSeen}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel.partner/fetched]
                                        {MessagingNotificationHandler/_handleNotificationChannelPartnerFetched}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel.partner/typing_status]
                                        {MessagingNotificationHandler/_handleNotificationChannelPartnerTypingStatus}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel/new_message]
                                        {if}
                                            @channelsLeft
                                            .{Set/has}
                                                @message
                                                .{Dict/get}
                                                    payload
                                                .{Dict/get}
                                                    id
                                        .{then}
                                            {Dev/comment}
                                                '_handleNotificationChannelMessage' tries to pin the channel,
                                                which is not desirable if the channel was just left.
                                                The issue happens because the longpolling request resolves with
                                                notifications for the channel that was just left (the channels
                                                to observe are determined when the longpolling starts waiting,
                                                not when it resolves).
                                        .{else}
                                            {MessagingNotificationHandler/_handleNotificationChannelMessage}
                                                [0]
                                                    @record
                                                [1]
                                                    @message
                                                    .{Dict/get}
                                                        payload
                                    [mail.message/delete]
                                        {MessagingNotificationHandler/_handleNotificationMessageDelete}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.message/inbox]
                                        {MessagingNotificationHandler/_handleNotificationNeedaction}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.message/mark_as_read]
                                        {MessagingNotificationHandler/_handleNotificationPartnerMarkAsRead}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.message/notification_update]
                                        {MessagingNotificationHandler/_handleNotificationPartnerMessageNotificationUpdate}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [simple_notification]
                                        {MessagingNotificationHandler/_handleNotificationSimpleNotification}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.message/toggle_star]
                                        {MessagingNotificationHandler/_handleNotificationPartnerToggleStar}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel/transient_message]
                                        {MessagingNotificationHandler/_handleNotificationPartnerTransientMessage}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel/leave]
                                        {MessagingNotificationHandler/_handleNotificationChannelLeave}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [res.users/connection]
                                        {MessagingNotificationHandler/_handleNotificationPartnerUserConnection}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.activity/updated]
                                        {Env/bus}
                                        .{Bus/trigger}
                                            [0]
                                                activity_updated
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel/unpin]
                                        {MessagingNotificationHandler/_handleNotificationChannelUnpin}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel/joined]
                                        {MessagingNotificationHandler/_handleNotificationChannelJoined}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel/last_interest_dt_changed]
                                        {MessagingNotificationHandler/_handleNotificationChannelLastInterestDateTimeChanged}
                                                [0]
                                                    @record
                                                [1]
                                                    @message
                                                    .{Dict/get}
                                                        payload
                                    [mail.channel/legacy_insert]
                                        {Record/insert}
                                            [Record/traits] 
                                                Thread
                                            {Thread/convertData}
                                                [Thread/model]
                                                    mail.channel
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel/insert]
                                        {MessagingNotificationHandler/_handleNotificationChannelUpdate}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.guest/insert]
                                        {Record/insert}
                                            [Record/traits]
                                                Guest
                                            @message
                                            .{Dict/get}
                                                payload
                                    [mail.message/insert]
                                        {Record/insert}
                                            {Record/traits}
                                                Message
                                            @message
                                            .{Dict/get}
                                                payload
                                    [mail.channel.rtc.session/insert]
                                        {Record/insert}
                                            [Record/traits]
                                                RtcSession
                                            @message
                                            .{Dict/get}
                                                payload
                                    [res.users.settings/changed]
                                        {MessagingNotificationHandler/_handleNotificationResUsersSettings}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel.rtc.session/peer_notification]
                                        {MessagingNotificationHandler/_handleNotificationRtcPeerToPeer}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel/rtc_sessions_update]
                                        {MessagingNotificationHandler/_handleNotificationRtcSessionUpdate}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [mail.channel.rtc.session/ended]
                                        {MessagingNotificationHandler/_handleNotificationRtcSessionEnded}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    [res.users.settings/volumes_update]
                                        {MessagingNotificationHandler/_handleNotificationVolumeSettingUpdate}
                                            [0]
                                                @record
                                            [1]
                                                @message
                                                .{Dict/get}
                                                    payload
                                    []
                                        {MessagingNotificationHandler/_handleNotification}
                                            [0]
                                                @record
                                            [1]
                                                @message
            {Record/doAsync}
                {Promise/all}
                    @proms
`;
