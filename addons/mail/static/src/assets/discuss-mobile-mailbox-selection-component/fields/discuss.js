/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            discuss
        [Field/model]
            DiscussMobileMailboxSelectionComponent
        [Field/type]
            one
        [Field/target]
            Discuss
        [Field/isRequired]
            true
`;
