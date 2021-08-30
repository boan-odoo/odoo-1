/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onUpdate
        [Lifecycle/model]
            RtcCallViewerComponent
        [Lifecycle/behavior]
            {RtcCallViewerComponent/_setTileLayout}
                @record
`;
