/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            guest
        [Field/model]
            RtcSession
        [Field/type]
            one
        [Field/target]
            Guest
        [Field/inverse]
            Guest/rtcSessions
`;
