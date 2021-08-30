/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Active mobile navbar tab, either 'mailbox', 'chat', or 'channel'.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            activeMobileNavbarTabId
        [Field/model]
            Discuss
        [Field/type]
            attr
        [Field/target]
            String
        [Field/default]
            mailbox
`;
