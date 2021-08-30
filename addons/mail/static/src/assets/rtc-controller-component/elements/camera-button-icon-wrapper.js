/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            cameraButtonIconWrapper
        [Element/model]
            RtcControllerComponent
        [Record/traits]
            RtcControllerComponent/buttonIconWrapper
`;
