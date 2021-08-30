/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            RtcPeerNotification
        [Model/fields]
            channelId
            event
            id
            payload
            senderId
            targetTokens
        [Model/id]
            RtcPeerNotification/id
`;
