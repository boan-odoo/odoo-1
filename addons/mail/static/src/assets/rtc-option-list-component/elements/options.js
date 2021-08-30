/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            options
        [Element/model]
            RtcOptionListComponent
        [Record/traits]
            RtcOptionListComponent/button
        [Element/onClick]
            {RtcOptionList/onClickOptions}
                [0]
                    @record
                    .{RtcOptionListComponent/rtcOptionList}
                [1]
                    @ev
`;
