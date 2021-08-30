/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            tiledInputContainer
        [Element/model]
            RtcLayoutMenuComponent
        [Record/traits]
            RtcLayoutMenuComponent/inputContainer
`;
