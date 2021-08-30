/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            pttName
        [Element/model]
            RtcConfigurationMenuComponent
        [Record/traits]
           RtcConfigurationMenuComponent/optionName
        [web.Element/textContent]
            {Locale/text}
                Use Push-to-talk
`;
