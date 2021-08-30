/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            pttKeyName
        [Element/model]
            RtcConfigurationMenuComponent
        [Record/traits]
            RtcConfigurationMenuComponent/optionName
        [web.Element/textContent]
            {Locale/text}
                Push-to-talk key
`;
