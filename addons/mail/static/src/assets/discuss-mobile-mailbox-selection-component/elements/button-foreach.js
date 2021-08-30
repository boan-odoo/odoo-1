/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            buttonForeach
        [Element/model]
            DiscussMobileMailboxSelectionComponent
        [Record/traits]
            Foreach
        [Field/target]
            DiscussMobileMailboxSelectionComponent:button
        [Foreach/collection]
            {DiscussMobileMailboxSelectionComponent/getOrderedMailboxes}
                @record
        [DiscussMobileMailboxSelectionComponent:button/mailbox]
            @field
            .{Foreach/get}
                mailbox
        [Foreach/as]
            mailbox
        [Element/key]
            @field
            .{Foreach/get}
                mailbox
            .{Record/id}
`;
