/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            dialogForeach
        [Element/model]
            DialogManagerComponent
        [Record/traits]
            Foreach
        [Field/target]
            DialogManagerComponent:dialog
        [DialogManagerComponent:dialog/dialog]
            @field
            .{Foreach/get}
                dialog
        [Foreach/collection]
            {DialogManager/dialogs}
        [Foreach/as]
            dialog
        [Element/key]
            @field
            .{Foreach/get}
                dialog
            .{Record/id}
`;
