/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessagingNotificationHandler/_handleNotificationChannelRenamed
        [Action/params]
            notificationHandler
                [type]
                    MessagingNotificationHandler
            id
                [type]
                    integer
            name
                [type]
                    String
        [Action/behavior]
            {Record/insert}
                [Record/traits]
                    Thread
                [Thread/id]
                    @id
                [Thread/model]
                    mail.channel
                [Thread/name]
                    @name
`;
