/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            settingsContent
        [Element/model]
            RtcCallViewerComponent
        [Field/target]
            RtcConfigurationMenuComponent
`;
