/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessagingNotificationHandler/_handleNotificationChannelUnpin
        [Action/params]
            record
                [type]
                    MessagingNotificationHandler
            id
                [type]
                    Omteger
        [Action/behavior]
            :channel
                {Record/findById}
                    [Thread/id]
                        @id
                    [Thread/model]
                        mail.channel
            {if}
                @channel
                .{isFalsy}
            .{then}
                {break}
            :message
                {String/sprintf}
                    [0]
                        {Locale/text}
                            You unpinned your conversation with %s.
                    [1]
                        @channel
                        .{Thread/displayName}
            @env
            .{Env/owlEnv}
            .{Dict/get}
                services
            .{Dict/get}
                notification
            .{Dict/get}
                notify
            .{Function/call}
                [message]
                    @message
                [type]
                    info
            {Dev/comment}
                We assume that arriving here the server has effectively
                unpinned the channel
            {Record/update}
                [0]
                    @channel
                [1]
                    [Thread/isServerPinned]
                        false
                    [Thread/members]
                        {Field/remove}
                            {Env/currentPartner}
`;
