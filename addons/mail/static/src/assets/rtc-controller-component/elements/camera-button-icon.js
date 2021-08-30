/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            cameraButtonIcon
        [Element/model]
            RtcControllerComponent
        [Record/traits]
            RtcControllerComponent/buttonIcon
        [web.Element/class]
            oi-video--filled
`;
