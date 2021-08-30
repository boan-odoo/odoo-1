/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            deleteMessageConfirmView
        [Field/model]
            Dialog
        [Field/type]
            one
        [Field/target]
            DeleteMessageConfirmView
        [Field/isCausal]
            true
        [Field/inverse]
            DeleteMessageConfirmView/dialogOwner
        [Field/compute]
            {if}
                @record
                .{Dialog/messageActionListOwnerAsDeleteConfirm}
            .{then}
                {Record/insert}
                    [Record/traits]
                        Dialog
            .{else}
                {Record/empty}
`;
