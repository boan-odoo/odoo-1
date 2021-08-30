/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessagingNotificationHandler/_handleNotificationChannelUpdate
        [Action/params]
            channelData
                [type]
                    Object
        [Action/behavior]
            {Record/insert}
                [Record/traits]
                    Thread
                [Thread/model]
                    mail.channel
                @channelData
`;
