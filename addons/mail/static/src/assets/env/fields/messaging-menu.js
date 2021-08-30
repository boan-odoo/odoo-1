/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            messagingMenu
        [Field/model]
            Env
        [Field/type]
            one
        [Field/target]
            MessagingMenu
        [Field/isCausal]
            true
        [Field/isReadonly]
            true
        [Field/default]
            {Record/insert}
                [Record/traits]
                    MessagingMenu
`;
