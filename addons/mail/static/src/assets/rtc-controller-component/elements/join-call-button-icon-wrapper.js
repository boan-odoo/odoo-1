/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            joinCallButtonIconWrapper
        [Element/model]
            RtcControllerComponent
        [Record/traits]
            RtcControllerComponent/buttonIconWrapper
`;
