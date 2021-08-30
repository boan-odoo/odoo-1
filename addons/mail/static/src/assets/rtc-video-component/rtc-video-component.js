/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Model
        [Model/name]
            RtcVideoComponent
        [Model/fields]
            rtcSession
        [Model/template]
            root
        [Model/lifecycles]
            onUpdate
`;
