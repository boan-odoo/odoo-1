/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            inputGroup
        [Element/model]
            RtcConfigurationMenuComponent
        [web.Element/style]
            [web.scss/display]
                flex
            [web.scss/width]
                100%
`;
