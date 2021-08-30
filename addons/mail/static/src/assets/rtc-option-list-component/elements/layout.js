/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            layout
        [Element/model]
            RtcOptionListComponent
        [Record/traits]
            RtcOptionListComponent/button
        [Element/onClick]
            {RtcOptionList/onClickLayout}
                [0]
                    @record
                    .{RtcOptionListComponent/rtcOptionList}
                [1]
                    @ev
`;
