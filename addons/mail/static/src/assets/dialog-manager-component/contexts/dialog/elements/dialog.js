/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            dialog
        [Element/model]
            DialogManagerComponent:dialog
        [Field/target]
            DialogComponent
        [DialogComponent/dialog]
            @record
            .{DialogManagerComponent:dialog/dialog}
`;
