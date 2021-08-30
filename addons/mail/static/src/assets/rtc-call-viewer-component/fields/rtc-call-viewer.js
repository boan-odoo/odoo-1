/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            rtcCallViewer
        [Field/model]
            RtcCallViewerComponent
        [Field/type]
            one
        [Field/target]
            RtcCallViewer
        [Field/isRequired]
            true
`;
