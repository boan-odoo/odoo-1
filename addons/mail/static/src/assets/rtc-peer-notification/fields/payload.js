/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            payload
        [Field/model]
            RtcPeerNotification
        [Field/isReadonly]
            true
`;
