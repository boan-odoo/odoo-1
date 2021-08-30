/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            pttDelayLabel
        [Element/model]
            RtcConfigurationMenuComponent
        [Record/traits]
            RtcConfigurationMenuComponent/optionLabel
        [web.Element/title]
            {Locale/text}
                Delay after releasing push-to-talk
        [web.Element/aria-label]
            {Locale/text}
                Delay after releasing push-to-talk
`;
