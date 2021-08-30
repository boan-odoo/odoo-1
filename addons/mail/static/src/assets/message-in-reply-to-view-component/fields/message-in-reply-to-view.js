/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            messageInReplyToView
        [Field/model]
            MessageInReplyToViewComponent
        [Field/type]
            one
        [Field/target]
            MessageInReplyToView
        [Field/isRequired]
            true
`;
