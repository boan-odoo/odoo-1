/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Determines the optional 'Partner' associated to 'this'.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            partner
        [Field/model]
            SuggestedRecipientInfo
        [Field/type]
            one
        [Field/target]
            Partner
`;
