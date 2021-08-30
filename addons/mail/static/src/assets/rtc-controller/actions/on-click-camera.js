/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            RtcController/onClickCamera
        [Action/params]
            ev
                [type]
                    MouseEvent
            record
                [type]
                    RtcController
        [Action/behavior]
            {Rtc/toggleUserVideo}
`;
