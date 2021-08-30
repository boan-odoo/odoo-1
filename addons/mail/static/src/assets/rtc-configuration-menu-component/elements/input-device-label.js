/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            inputDeviceLabel
        [Element/model]
            RtcConfigurationMenuComponent
        [Record/traits]
            RtcConfigurationMenuComponent/optionLabel
        [web.Element/title]
            {Locale/text}
                Input device
        [web.Element/aria-label]
            {Locale/text}
                Input device
`;
