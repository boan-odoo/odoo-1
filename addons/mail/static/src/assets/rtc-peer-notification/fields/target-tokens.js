/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            targetTokens
        [Field/model]
            RtcPeerNotification
        [Field/isReadonly]
            true
        [Field/isRequired]
            true
`;
