/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            component
        [Field/model]
            RtcLayoutMenu
        [Field/type]
            attr
        [Field/target]
            RtcLayoutMenuComponent
`;
