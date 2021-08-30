/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            voiceDetectionGroup
        [Element/model]
            RtcConfigurationMenuComponent
        [Record/traits]
            RtcConfigurationMenuComponent/inputGroup
`;
