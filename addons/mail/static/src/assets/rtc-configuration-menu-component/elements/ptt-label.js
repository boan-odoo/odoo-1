/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            pttLabel
        [Element/model]
            RtcConfigurationMenuComponent
        [Record/traits]
           RtcConfigurationMenuComponent/optionLabel
        [web.Element/title]
            {Locale/text}
                Use Push-to-talk
        [web.Element/aria-label]
            {Locale/text}
                Use Push-to-talk
`;
