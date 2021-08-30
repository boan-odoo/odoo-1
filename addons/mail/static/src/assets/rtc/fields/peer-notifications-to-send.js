/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            peerNotificationsToSend
        [Field/model]
            Rtc
        [Field/type]
            many
        [Field/target]
            RtcPeerNotification
        [Field/isCausal]
            true
`;
