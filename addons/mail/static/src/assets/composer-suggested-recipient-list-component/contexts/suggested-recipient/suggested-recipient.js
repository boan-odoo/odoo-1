/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Context
        [Context/name]
            suggestedRecipient
        [Context/model]
            ComposerSuggestedRecipientListComponent
        [Model/fields]
            recipientInfo
        [Model/template]
            suggestedRecipientForeach
                suggestedRecipient
`;
