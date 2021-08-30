/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            recipientInfo
        [Field/model]
            ComposerSuggestedRecipientListComponent:suggestedRecipient
        [Field/type]
            one
        [Field/target]
            SuggestedRecipientInfo
        [Field/isRequired]
            true
`;
