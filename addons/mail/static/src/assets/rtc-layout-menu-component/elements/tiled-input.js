/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            tiledInput
        [Element/model]
            RtcLayoutMenuComponent
        [Record/traits]
            RtcLayoutMenuComponent/input
        [web.Element/name]
            layout
        [web.Element/value]
            tiled
        [Element/onClick]
            {RtcLayoutMenu/onClickLayout}
                [0]
                    @record
                    .{RtcLayoutMenuComponent/layoutMenu}
                [1]
                    @ev
        [web.Element/isChecked]
            {Env/userSetting}
            .{UserSetting/rtcLayout}
            .{=}
                tiled
`;
